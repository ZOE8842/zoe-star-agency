// Reminder-Cron · läuft per Vercel-Cron (siehe vercel.json)
// Sendet E-Mail-Reminder via Resend für:
// - ungelesene Nachrichten > 24 h
// - Pflicht-Nachrichten unack > 12 h
// - Slots startend in 6 h (planned, noch nicht gewent_live)
// - Open Support-Tickets > 12 h ohne Antwort

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import {
  sendOnboardingReminder,
  sendPendingApproveReminder,
  sendShowcaseIncompleteReminder,
  type OnboardingStage,
} from "@/lib/email/reminder-mails";
import { checkCronAuth } from "@/lib/security/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 200 messages × multiple email-blocks → 60s default zu eng.
// Vercel Pro erlaubt bis 300s. Wir nehmen 180s als sicheres Mittel.
export const maxDuration = 180;

export async function GET(request: NextRequest) {
  // Fail-closed Cron-Auth: ohne CRON_SECRET kein Zugriff.
  const denied = checkCronAuth(request);
  if (denied) return denied;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@zoe-star.de";

  const stats = {
    unread: 0,
    ack: 0,
    slots: 0,
    support: 0,
    backstage_alert: 0,
    onboarding_drip: 0,
    pending_approve: 0,
    showcase_incomplete: 0,
    errors: [] as string[],
  };
  // Cap fuer die neuen Drip-Bloecke (Block 6-8). Schuetzt vor
  // Resend-Free-Tier 100/Tag-Limit bei wachsender Creator-Anzahl.
  // Alte Bloecke (1, 2, 4, 5) haben eigene limit(...)-Clauses.
  const DRIP_MAIL_CAP = 80;
  let dripMailsSent = 0;
  const now = new Date();
  const _24h = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const _12h = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();
  const _6h_future = new Date(now.getTime() + 6 * 3600 * 1000).toISOString();
  const _3d = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString();
  const _7d = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const _72h = new Date(now.getTime() - 72 * 3600 * 1000).toISOString();

  // ===== 1. UNREAD MESSAGES > 24h =====
  // Hole Messages älter als 24h
  const { data: oldMessages } = await supabase
    .from("messages")
    .select("id, subject, recipient_id, recipient_group, sent_at")
    .lt("sent_at", _24h)
    .limit(200);

  // PERF: alle aktiven Creator + Direct-Recipients in EINER Query (statt N+1)
  const directRecipientIds = Array.from(new Set(
    (oldMessages ?? []).map((m) => m.recipient_id).filter((id): id is string => !!id),
  ));
  const hasBroadcast = (oldMessages ?? []).some((m) => m.recipient_group === "all_creators");
  const profileQuery = supabase.from("profiles").select("id, email, role, status");
  let allRelevantProfiles: { id: string; email: string | null; role: string; status: string }[] = [];
  if (hasBroadcast && directRecipientIds.length > 0) {
    const { data } = await profileQuery.or(
      `id.in.(${directRecipientIds.join(",")}),and(role.eq.creator,status.eq.active)`,
    );
    allRelevantProfiles = data ?? [];
  } else if (hasBroadcast) {
    const { data } = await profileQuery.eq("role", "creator").eq("status", "active");
    allRelevantProfiles = data ?? [];
  } else if (directRecipientIds.length > 0) {
    const { data } = await profileQuery.in("id", directRecipientIds);
    allRelevantProfiles = data ?? [];
  }
  const profileMap = new Map(allRelevantProfiles.map((p) => [p.id, p]));
  const activeCreators = allRelevantProfiles.filter((p) => p.role === "creator" && p.status === "active");

  // PERF: alle relevanten message_reads + notifications gebatched
  const allMessageIds = (oldMessages ?? []).map((m) => m.id);
  const { data: allReads } = allMessageIds.length > 0
    ? await supabase
        .from("message_reads")
        .select("message_id, reader_id")
        .in("message_id", allMessageIds)
    : { data: [] };
  const readSet = new Set((allReads ?? []).map((r) => `${r.message_id}:${r.reader_id}`));

  const allReminderLinks = allMessageIds.map((id) => `/portal/inbox/${id}`);
  const { data: existingReminders } = allReminderLinks.length > 0
    ? await supabase
        .from("notifications")
        .select("user_id, link")
        .eq("type", "reminder")
        .in("link", allReminderLinks)
    : { data: [] };
  const reminderSet = new Set((existingReminders ?? []).map((n) => `${n.link}:${n.user_id}`));

  for (const msg of oldMessages || []) {
    // Empfänger aus Map ableiten
    let recipients: { id: string; email: string }[] = [];
    if (msg.recipient_id) {
      const p = profileMap.get(msg.recipient_id);
      if (p?.email) recipients = [{ id: p.id, email: p.email }];
    } else if (msg.recipient_group === "all_creators") {
      recipients = activeCreators
        .filter((p) => p.email)
        .map((p) => ({ id: p.id, email: p.email as string }));
    }

    for (const r of recipients) {
      if (readSet.has(`${msg.id}:${r.id}`)) continue;
      if (reminderSet.has(`/portal/inbox/${msg.id}:${r.id}`)) continue;

      // Lock-Insert ZUERST → bei Insert-Failure (z.B. Race mit parallelem
      // Cron-Run) kein Send. Verhindert Doppel-Send-Risk.
      const { error: lockErr } = await supabase.from("notifications").insert({
        user_id: r.id, type: "reminder",
        title: "Ungelesene Nachricht",
        body: msg.subject,
        link: `/portal/inbox/${msg.id}`,
        channel: ["email"],
        status: "read",
        read_at: now.toISOString(),
      });
      if (lockErr) {
        stats.errors.push(`unread_lock/${r.id}: ${lockErr.message}`);
        continue;
      }

      try {
        await resend.emails.send({
          from: `ZOE Star Agency <${fromEmail}>`,
          to: r.email,
          subject: `Ungelesene Nachricht: ${msg.subject}`,
          text: `Du hast eine ungelesene Nachricht im ZOE Portal:\n\n"${msg.subject}"\n\nBitte einloggen: ${process.env.NEXT_PUBLIC_SITE_URL}/portal/inbox\n\nZOE Star Agency`,
        });
        stats.unread++;
      } catch (e: any) {
        stats.errors.push(`unread/${r.id}: ${e.message}`);
        // Lock-Row bleibt drin → kein Spam-Retry. Akzeptabel.
      }
    }
  }

  // ===== 2. ACKNOWLEDGE-REQUIRED > 12h =====
  const { data: ackMessages } = await supabase
    .from("messages")
    .select("id, subject, recipient_id, recipient_group, sent_at")
    .eq("requires_ack", true)
    .lt("sent_at", _12h)
    .limit(100);

  // PERF: profiles batched (Direct-Recipients + alle aktiven Creators)
  const ackDirectIds = Array.from(new Set(
    (ackMessages ?? []).map((m) => m.recipient_id).filter((id): id is string => !!id),
  ));
  const ackHasBroadcast = (ackMessages ?? []).some((m) => m.recipient_group === "all_creators");
  const ackProfileQuery = supabase.from("profiles").select("id, email, role, status");
  let ackProfiles: { id: string; email: string | null; role: string; status: string }[] = [];
  if (ackHasBroadcast && ackDirectIds.length > 0) {
    const { data } = await ackProfileQuery.or(
      `id.in.(${ackDirectIds.join(",")}),and(role.eq.creator,status.eq.active)`,
    );
    ackProfiles = data ?? [];
  } else if (ackHasBroadcast) {
    const { data } = await ackProfileQuery.eq("role", "creator").eq("status", "active");
    ackProfiles = data ?? [];
  } else if (ackDirectIds.length > 0) {
    const { data } = await ackProfileQuery.in("id", ackDirectIds);
    ackProfiles = data ?? [];
  }
  const ackProfileMap = new Map(ackProfiles.map((p) => [p.id, p]));
  const ackActiveCreators = ackProfiles.filter((p) => p.role === "creator" && p.status === "active");

  // PERF: message_reads batched
  const ackMessageIds = (ackMessages ?? []).map((m) => m.id);
  const { data: ackReads } = ackMessageIds.length > 0
    ? await supabase
        .from("message_reads")
        .select("message_id, reader_id, acknowledged_at")
        .in("message_id", ackMessageIds)
        .not("acknowledged_at", "is", null)
    : { data: [] };
  const ackedSet = new Set((ackReads ?? []).map((r) => `${r.message_id}:${r.reader_id}`));

  // Dedupe: bereits gesendete ack-Reminder (innerhalb 24h Window)
  const ackReminderLinks = ackMessageIds.map((id) => `/portal/inbox/${id}#ack`);
  const { data: existingAckReminders } = ackReminderLinks.length > 0
    ? await supabase
        .from("notifications")
        .select("user_id, link")
        .eq("type", "reminder")
        .in("link", ackReminderLinks)
        .gte("created_at", _24h)
    : { data: [] };
  const ackReminderSet = new Set(
    (existingAckReminders ?? []).map((n) => `${n.link}:${n.user_id}`),
  );

  for (const msg of ackMessages || []) {
    let recipients: { id: string; email: string }[] = [];
    if (msg.recipient_id) {
      const p = ackProfileMap.get(msg.recipient_id);
      if (p?.email) recipients = [{ id: p.id, email: p.email }];
    } else if (msg.recipient_group === "all_creators") {
      recipients = ackActiveCreators
        .filter((p) => p.email)
        .map((p) => ({ id: p.id, email: p.email as string }));
    }

    for (const r of recipients) {
      if (ackedSet.has(`${msg.id}:${r.id}`)) continue;
      const ackLink = `/portal/inbox/${msg.id}#ack`;
      if (ackReminderSet.has(`${ackLink}:${r.id}`)) continue;

      // Lock-Insert ZUERST → kein Doppel-Send bei parallelen Runs.
      const { error: lockErr } = await supabase.from("notifications").insert({
        user_id: r.id,
        type: "reminder",
        title: "Pflicht-Nachricht offen",
        body: msg.subject,
        link: ackLink,
        channel: ["email"],
        status: "unread",
      });
      if (lockErr) {
        stats.errors.push(`ack_lock/${r.id}: ${lockErr.message}`);
        continue;
      }

      try {
        await resend.emails.send({
          from: `ZOE Star Agency <${fromEmail}>`,
          to: r.email,
          subject: `⚠ Pflicht-Nachricht: ${msg.subject}`,
          text: `Eine Pflicht-Nachricht erfordert deine Bestätigung:\n\n"${msg.subject}"\n\nBitte im Portal lesen + bestätigen: ${process.env.NEXT_PUBLIC_SITE_URL}/portal/inbox\n\nZOE Star Agency`,
        });
        stats.ack++;
      } catch (e: any) {
        stats.errors.push(`ack/${r.id}: ${e.message}`);
      }
    }
  }

  // ===== 3. LIVE-SLOT-REMINDER deaktiviert =====
  // Altes "slots"-System ersetzt durch Creator Services (tiktok_push_requests).
  // Reminder-Logik wird in Phase B mit dem TikTok-Push-Modul reaktiviert.
  // void _6h_future zur Vermeidung "unused" warnings, falls oben deklariert.
  void _6h_future;

  // ===== 4. SUPPORT-TICKETS open > 12h ohne Antwort =====
  const { data: pendingTickets } = await supabase
    .from("support_tickets")
    .select("id, creator_id, subject, status, created_at")
    .in("status", ["open", "in_progress"])
    .lt("created_at", _12h)
    .limit(50);

  // PERF: support_messages-Replies fuer alle Tickets gebatched
  const ticketIds = (pendingTickets ?? []).map((t) => t.id);
  const repliedTickets = new Set<string>();
  if (ticketIds.length > 0) {
    const { data: allReplies } = await supabase
      .from("support_messages")
      .select("ticket_id, sender_id")
      .in("ticket_id", ticketIds);
    const ticketCreatorMap = new Map(
      (pendingTickets ?? []).map((t) => [t.id, t.creator_id]),
    );
    for (const r of allReplies ?? []) {
      if (r.sender_id !== ticketCreatorMap.get(r.ticket_id)) {
        repliedTickets.add(r.ticket_id);
      }
    }
  }

  // Dedupe: support-Reminder pro Ticket+Admin max 1× pro 24h.
  // Admin-IDs nochmal expliziter holen (email-Result hatte keine id).
  const { data: supportAdminFull } = pendingTickets && pendingTickets.length > 0
    ? await supabase.from("profiles")
        .select("id, email, display_name").eq("role", "admin").eq("status", "active")
    : { data: [] };
  const supportTicketIds = (pendingTickets ?? []).filter((t) => !repliedTickets.has(t.id)).map((t) => t.id);
  const supportReminderLinks = supportTicketIds.map((id) => `/portal/admin/support#ticket-${id}`);
  const { data: existingSupportReminders } = supportReminderLinks.length > 0
    ? await supabase
        .from("notifications")
        .select("user_id, link")
        .eq("type", "reminder")
        .in("link", supportReminderLinks)
        .gte("created_at", _24h)
    : { data: [] };
  const supportReminderSet = new Set(
    (existingSupportReminders ?? []).map((n) => `${n.link}:${n.user_id}`),
  );

  for (const ticket of pendingTickets || []) {
    if (repliedTickets.has(ticket.id)) continue;

    for (const admin of supportAdminFull || []) {
      if (!admin.email || !admin.id) continue;
      const ticketLink = `/portal/admin/support#ticket-${ticket.id}`;
      if (supportReminderSet.has(`${ticketLink}:${admin.id}`)) continue;

      // Lock-Insert ZUERST → kein Doppel-Send.
      const { error: lockErr } = await supabase.from("notifications").insert({
        user_id: admin.id,
        type: "reminder",
        title: "Support-Ticket offen",
        body: ticket.subject,
        link: ticketLink,
        channel: ["email"],
        status: "unread",
      });
      if (lockErr) {
        stats.errors.push(`support_lock/${admin.id}/${ticket.id}: ${lockErr.message}`);
        continue;
      }

      try {
        await resend.emails.send({
          from: `ZOE Star Agency <${fromEmail}>`,
          to: admin.email,
          subject: `Support-Ticket wartet auf Antwort: ${ticket.subject}`,
          text: `Hi ${admin.display_name},\n\nein Support-Ticket wartet seit über 12h auf eine Antwort:\n\n"${ticket.subject}"\n\nBearbeiten: ${process.env.NEXT_PUBLIC_SITE_URL}/portal/admin\n\nZOE Star Agency`,
        });
        stats.support++;
      } catch (e: any) {
        stats.errors.push(`support/${ticket.id}: ${e.message}`);
      }
    }
  }

  // ===== 5. BACKSTAGE-SYNC ALERT — 2 Tage in Folge fail =====
  // Wenn der lokale Backstage-Daily-Sync 2 Tage in Folge ok=false hat,
  // bekommen Admins eine Resend-Mail. Dedupe via notifications-Table:
  // pro Admin max 1× pro 24 h.
  try {
    const _2d = new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("data_source_health")
      .select("ok, created_at")
      .eq("source", "backstage_sync")
      .gte("created_at", _2d)
      .order("created_at", { ascending: false })
      .limit(20);

    const runs = recent ?? [];
    // 2 Tage in Folge fail = ALLE in den letzten 2 Tagen sind ok=false UND
    // mindestens 2 Runs vorhanden (sonst ist es nur ein einmaliger Fail).
    const failingStreak = runs.length >= 2 && runs.every((r) => r.ok === false);

    if (failingStreak) {
      const { data: admins } = await supabase.from("profiles")
        .select("id, email, display_name")
        .eq("role", "admin").eq("status", "active");

      // PERF: Dedupe-Set fuer alle Admins gebatched (statt 1 Query pro Admin)
      const backstageAdminIds = (admins ?? []).map((a) => a.id);
      const { data: existingBackstageDups } = backstageAdminIds.length > 0
        ? await supabase
            .from("notifications")
            .select("user_id")
            .eq("type", "reminder")
            .eq("link", "/portal/admin/analyse/health")
            .gte("created_at", _24h)
            .in("user_id", backstageAdminIds)
        : { data: [] };
      const backstageDupSet = new Set((existingBackstageDups ?? []).map((d) => d.user_id));

      for (const admin of admins || []) {
        if (backstageDupSet.has(admin.id)) continue;

        // Lock-Insert ZUERST → kein Doppel-Send bei parallelem Run.
        const { error: lockErr } = await supabase.from("notifications").insert({
          user_id: admin.id,
          type: "reminder",
          title: "Backstage-Sync 2 Tage offline",
          body: "Daily-Sync hat 2× in Folge fehlgeschlagen — bitte Admin-Health pruefen.",
          link: "/portal/admin/analyse/health",
          channel: ["email"],
          status: "unread",
        });
        if (lockErr) {
          stats.errors.push(`backstage_alert_lock/${admin.id}: ${lockErr.message}`);
          continue;
        }

        try {
          await resend.emails.send({
            from: `ZOE Star Agency <${fromEmail}>`,
            to: admin.email,
            subject: "⚠ Backstage-Sync faellt seit 2 Tagen aus",
            text: `Hi ${admin.display_name},\n\nder Backstage-Daily-Sync hat in den letzten 2 Tagen kein einziges Mal sauber durchgelaufen.\n\nMoegliche Ursachen:\n- zoeapp Chrome-Profile ausgeloggt\n- TikTok-Backstage-Layout geaendert\n- Windows-Task-Scheduler haengt\n\nCheck: ${process.env.NEXT_PUBLIC_SITE_URL}/portal/admin/analyse/health\nDetails: data_source_health Tabelle, source='backstage_sync'\n\nZOE Star Agency`,
          });
          stats.backstage_alert++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          stats.errors.push(`backstage_alert/${admin.id}: ${msg}`);
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    stats.errors.push(`backstage_alert_check: ${msg}`);
  }

  // ===== 6. ONBOARDING-DRIP (3 Stufen) =====
  // Creator ohne abgeschlossenes Onboarding bekommen Reminder bei
  // 24-72h (Stage 1), 72h-7d (Stage 2), >7d (Stage 3).
  // Dedup: Lock-Insert ZUERST, dann Mail-Send (verhindert Spam-Retry
  // bei Insert-Failure).
  try {
    const { data: onbCreators } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at, status")
      .eq("role", "creator")
      .eq("onboarding_completed", false)
      .in("status", ["pending", "active"])
      .not("email", "is", null)
      .lt("created_at", _24h)
      .limit(200);

    // PERF: bestehende Onboarding-Drip-Notifications einmal batched holen
    const onbIds = (onbCreators ?? []).map((p) => p.id);
    const { data: existingOnbNotifs } = onbIds.length > 0
      ? await supabase
          .from("notifications")
          .select("user_id, link")
          .eq("type", "reminder")
          .in("user_id", onbIds)
          .in("link", ["/portal/onboarding#drip-1", "/portal/onboarding#drip-2", "/portal/onboarding#drip-3"])
      : { data: [] };
    const onbDedupSet = new Set((existingOnbNotifs ?? []).map((n) => `${n.user_id}:${n.link}`));

    for (const p of onbCreators || []) {
      if (!p.email) continue;
      if (dripMailsSent >= DRIP_MAIL_CAP) {
        stats.errors.push("onboarding_drip: DRIP_MAIL_CAP reached");
        break;
      }

      const ageMs = now.getTime() - new Date(p.created_at).getTime();
      const ageDays = ageMs / (24 * 3600 * 1000);

      let stage: OnboardingStage;
      if (ageDays < 3) stage = 1;
      else if (ageDays < 7) stage = 2;
      else stage = 3;

      const dedupLink = `/portal/onboarding#drip-${stage}`;

      if (onbDedupSet.has(`${p.id}:${dedupLink}`)) continue;

      // Lock-Insert ZUERST — bei Insert-Failure kein Send (kein Spam).
      const { error: lockErr } = await supabase.from("notifications").insert({
        user_id: p.id,
        type: "reminder",
        title: `Onboarding-Erinnerung (Stage ${stage})`,
        body: stage === 3 ? "Letzte Erinnerung" : "Profil abschliessen",
        link: dedupLink,
        channel: ["email"],
        status: "read",
        read_at: now.toISOString(),
      });
      if (lockErr) {
        stats.errors.push(`onboarding_drip_lock/${p.id}: ${lockErr.message}`);
        continue;
      }

      try {
        await sendOnboardingReminder({
          email: p.email,
          display_name: p.display_name,
          stage,
        });
        stats.onboarding_drip++;
        dripMailsSent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        stats.errors.push(`onboarding_drip/${p.id}: ${msg}`);
        // Lock-Row bleibt drin — Stage geht beim naechsten Run NICHT
        // erneut raus. Akzeptabel: Stage wird verbraucht, Creator
        // bekommt naechste Stage zum richtigen Zeitpunkt.
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    stats.errors.push(`onboarding_drip_block: ${msg}`);
  }

  // ===== 7. PENDING-APPROVE ADMIN-REMINDER =====
  // Creator die Onboarding abgeschlossen haben aber >3d in pending
  // sind, erzeugen einen Admin-Reminder. Dedup pro Creator alle 7d.
  // Lock-Insert ZUERST (gleich wie Block 6).
  try {
    const { data: stale } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at")
      .eq("role", "creator")
      .eq("status", "pending")
      .eq("onboarding_completed", true)
      .not("email", "is", null)
      .lt("created_at", _3d)
      .limit(100);

    if ((stale || []).length > 0) {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .eq("role", "admin")
        .eq("status", "active")
        .not("email", "is", null);

      // PERF: alle stale×admin Dedupe-Lookups batched in EINEM Query
      // statt N×M Roundtrips
      const allDedupLinks = (stale ?? []).map((c) => `/portal/admin/pending#approve-${c.id}`);
      const adminIds = (admins ?? []).map((a) => a.id);
      const dupSet = new Set<string>();
      if (allDedupLinks.length > 0 && adminIds.length > 0) {
        const { data: existingDups } = await supabase
          .from("notifications")
          .select("user_id, link")
          .eq("type", "reminder")
          .in("link", allDedupLinks)
          .in("user_id", adminIds)
          .gte("created_at", _7d);
        for (const d of existingDups ?? []) {
          dupSet.add(`${d.user_id}:${d.link}`);
        }
      }

      for (const creator of stale || []) {
        const waiting_days = Math.floor(
          (now.getTime() - new Date(creator.created_at).getTime()) / (24 * 3600 * 1000),
        );

        for (const admin of admins || []) {
          if (!admin.email) continue;
          if (dripMailsSent >= DRIP_MAIL_CAP) {
            stats.errors.push("pending_approve: DRIP_MAIL_CAP reached");
            break;
          }

          const dedupLink = `/portal/admin/pending#approve-${creator.id}`;
          if (dupSet.has(`${admin.id}:${dedupLink}`)) continue;

          const { error: lockErr } = await supabase.from("notifications").insert({
            user_id: admin.id,
            type: "reminder",
            title: `Pending-Approve faellig (${waiting_days}d)`,
            body: `${creator.display_name || creator.email} wartet auf Freigabe`,
            link: dedupLink,
            channel: ["email"],
            status: "unread",
          });
          if (lockErr) {
            stats.errors.push(`pending_approve_lock/${admin.id}: ${lockErr.message}`);
            continue;
          }

          try {
            await sendPendingApproveReminder({
              admin_email: admin.email,
              admin_name: admin.display_name,
              creator_display_name: creator.display_name,
              creator_email: creator.email,
              waiting_days,
            });
            stats.pending_approve++;
            dripMailsSent++;
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            stats.errors.push(`pending_approve/${admin.id}/${creator.id}: ${msg}`);
          }
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    stats.errors.push(`pending_approve_block: ${msg}`);
  }

  // ===== 8. SHOWCASE-INCOMPLETE-REMINDER =====
  // Creator mit allow_website_showcase=true aber <2 Bildern bekommen
  // nach 24h eine Erinnerung. Dedup alle 7d. Lock-Insert ZUERST.
  try {
    const { data: showcased } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at, allow_website_showcase")
      .eq("role", "creator")
      .in("status", ["pending", "active"])
      .eq("allow_website_showcase", true)
      .not("email", "is", null)
      .lt("created_at", _24h)
      .limit(200);

    // PERF: showcase_creators-Rows und Notification-Dedupe batched holen
    const showIds = (showcased ?? []).map((p) => p.id);
    const showcaseDedupLink = "/portal/profile/showcase#incomplete";
    const [showcaseRowsRes, showcaseDupsRes] = showIds.length > 0
      ? await Promise.all([
          supabase
            .from("showcase_creators")
            .select("profile_id, showcase_images")
            .in("profile_id", showIds),
          supabase
            .from("notifications")
            .select("user_id")
            .eq("type", "reminder")
            .eq("link", showcaseDedupLink)
            .in("user_id", showIds)
            .gte("created_at", _7d),
        ])
      : [{ data: [] }, { data: [] }];
    const showcaseRowMap = new Map(
      (showcaseRowsRes.data ?? []).map((r) => [r.profile_id, r.showcase_images]),
    );
    const showcaseDupSet = new Set((showcaseDupsRes.data ?? []).map((d) => d.user_id));

    for (const p of showcased || []) {
      if (!p.email) continue;
      if (dripMailsSent >= DRIP_MAIL_CAP) {
        stats.errors.push("showcase_incomplete: DRIP_MAIL_CAP reached");
        break;
      }

      const showcaseImagesRaw = showcaseRowMap.get(p.id);
      const images = Array.isArray(showcaseImagesRaw) ? showcaseImagesRaw : [];
      if (images.length >= 2) continue;

      if (showcaseDupSet.has(p.id)) continue;
      const dedupLink = showcaseDedupLink;

      const { error: lockErr } = await supabase.from("notifications").insert({
        user_id: p.id,
        type: "reminder",
        title: `Showcase unvollstaendig (${images.length}/2)`,
        body: "Bilder fuer Public-Card hochladen",
        link: dedupLink,
        channel: ["email"],
        status: "read",
        read_at: now.toISOString(),
      });
      if (lockErr) {
        stats.errors.push(`showcase_incomplete_lock/${p.id}: ${lockErr.message}`);
        continue;
      }

      try {
        await sendShowcaseIncompleteReminder({
          email: p.email,
          display_name: p.display_name,
          images_count: images.length,
        });
        stats.showcase_incomplete++;
        dripMailsSent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        stats.errors.push(`showcase_incomplete/${p.id}: ${msg}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    stats.errors.push(`showcase_incomplete_block: ${msg}`);
  }

  // _72h / _12h-Werte werden in spaeteren Bloecken evtl. wieder benutzt,
  // unten reservieren wir die zur Vermeidung von unused-warnings.
  void _72h;

  return NextResponse.json({
    success: true,
    stats,
    timestamp: now.toISOString(),
  });
}
