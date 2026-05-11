// Reminder-Cron · läuft per Vercel-Cron (siehe vercel.json)
// Sendet E-Mail-Reminder via Resend für:
// - ungelesene Nachrichten > 24 h
// - Pflicht-Nachrichten unack > 12 h
// - Slots startend in 6 h (planned, noch nicht gewent_live)
// - Open Support-Tickets > 12 h ohne Antwort

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Vercel-Cron setzt Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@zoe-star.de";

  const stats = { unread: 0, ack: 0, slots: 0, support: 0, backstage_alert: 0, errors: [] as string[] };
  const now = new Date();
  const _24h = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const _12h = new Date(now.getTime() - 12 * 3600 * 1000).toISOString();
  const _6h_future = new Date(now.getTime() + 6 * 3600 * 1000).toISOString();

  // ===== 1. UNREAD MESSAGES > 24h =====
  // Hole Messages älter als 24h
  const { data: oldMessages } = await supabase
    .from("messages")
    .select("id, subject, recipient_id, recipient_group, sent_at")
    .lt("sent_at", _24h)
    .limit(200);

  for (const msg of oldMessages || []) {
    // Empfänger ermitteln
    let recipients: { id: string; email: string }[] = [];
    if (msg.recipient_id) {
      const { data } = await supabase.from("profiles").select("id, email").eq("id", msg.recipient_id).single();
      if (data) recipients = [data];
    } else if (msg.recipient_group === "all_creators") {
      const { data } = await supabase.from("profiles").select("id, email").eq("role", "creator").eq("status", "active");
      recipients = data || [];
    }

    for (const r of recipients) {
      // Schon gelesen?
      const { data: read } = await supabase.from("message_reads")
        .select("id").eq("message_id", msg.id).eq("reader_id", r.id).maybeSingle();
      if (read) continue;

      // Schon Reminder geschickt?
      const { data: existingNotif } = await supabase.from("notifications")
        .select("id").eq("user_id", r.id).eq("type", "reminder")
        .eq("link", `/portal/inbox/${msg.id}`).maybeSingle();
      if (existingNotif) continue;

      try {
        await resend.emails.send({
          from: `ZOE Star Agency <${fromEmail}>`,
          to: r.email,
          subject: `Ungelesene Nachricht: ${msg.subject}`,
          text: `Du hast eine ungelesene Nachricht im ZOE Portal:\n\n"${msg.subject}"\n\nBitte einloggen: ${process.env.NEXT_PUBLIC_SITE_URL}/portal/inbox\n\nZOE Star Agency`,
        });

        await supabase.from("notifications").insert({
          user_id: r.id, type: "reminder",
          title: "Ungelesene Nachricht",
          body: msg.subject,
          link: `/portal/inbox/${msg.id}`,
          channel: ["email"],
          status: "read",
          read_at: now.toISOString(),
        });
        stats.unread++;
      } catch (e: any) {
        stats.errors.push(`unread/${r.id}: ${e.message}`);
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

  for (const msg of ackMessages || []) {
    let recipients: { id: string; email: string }[] = [];
    if (msg.recipient_id) {
      const { data } = await supabase.from("profiles").select("id, email").eq("id", msg.recipient_id).single();
      if (data) recipients = [data];
    } else if (msg.recipient_group === "all_creators") {
      const { data } = await supabase.from("profiles").select("id, email").eq("role", "creator").eq("status", "active");
      recipients = data || [];
    }

    for (const r of recipients) {
      const { data: read } = await supabase.from("message_reads")
        .select("acknowledged_at").eq("message_id", msg.id).eq("reader_id", r.id).maybeSingle();
      if (read?.acknowledged_at) continue;

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

  for (const ticket of pendingTickets || []) {
    const { count: replyCount } = await supabase.from("support_messages")
      .select("*", { count: "exact", head: true })
      .eq("ticket_id", ticket.id)
      .neq("sender_id", ticket.creator_id);

    if ((replyCount ?? 0) > 0) continue; // schon geantwortet

    // Hole Admins
    const { data: admins } = await supabase.from("profiles")
      .select("email, display_name").eq("role", "admin").eq("status", "active");

    for (const admin of admins || []) {
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

      for (const admin of admins || []) {
        // Dedupe: hat der Admin in den letzten 24 h schon einen
        // backstage-Alert bekommen?
        const { data: dup } = await supabase.from("notifications")
          .select("id")
          .eq("user_id", admin.id)
          .eq("type", "reminder")
          .eq("link", "/portal/admin/analyse/health")
          .gte("created_at", _24h)
          .maybeSingle();
        if (dup) continue;

        try {
          await resend.emails.send({
            from: `ZOE Star Agency <${fromEmail}>`,
            to: admin.email,
            subject: "⚠ Backstage-Sync faellt seit 2 Tagen aus",
            text: `Hi ${admin.display_name},\n\nder Backstage-Daily-Sync hat in den letzten 2 Tagen kein einziges Mal sauber durchgelaufen.\n\nMoegliche Ursachen:\n- zoeapp Chrome-Profile ausgeloggt\n- TikTok-Backstage-Layout geaendert\n- Windows-Task-Scheduler haengt\n\nCheck: ${process.env.NEXT_PUBLIC_SITE_URL}/portal/admin/analyse/health\nDetails: data_source_health Tabelle, source='backstage_sync'\n\nZOE Star Agency`,
          });
          await supabase.from("notifications").insert({
            user_id: admin.id,
            type: "reminder",
            title: "Backstage-Sync 2 Tage offline",
            body: "Daily-Sync hat 2× in Folge fehlgeschlagen — bitte Admin-Health pruefen.",
            link: "/portal/admin/analyse/health",
            channel: ["email"],
            status: "unread",
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

  return NextResponse.json({
    success: true,
    stats,
    timestamp: now.toISOString(),
  });
}
