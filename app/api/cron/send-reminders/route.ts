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

  const stats = { unread: 0, ack: 0, slots: 0, support: 0, errors: [] as string[] };
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

  // ===== 3. SLOTS in 6h =====
  const { data: upcomingSlots } = await supabase
    .from("slots")
    .select("id, creator_id, start_at, duration_minutes")
    .eq("status", "planned")
    .gte("start_at", now.toISOString())
    .lte("start_at", _6h_future)
    .limit(100);

  for (const slot of upcomingSlots || []) {
    const { data: profile } = await supabase.from("profiles").select("email, display_name").eq("id", slot.creator_id).single();
    if (!profile) continue;

    try {
      await resend.emails.send({
        from: `ZOE Star Agency <${fromEmail}>`,
        to: profile.email,
        subject: `Live-Slot in wenigen Stunden`,
        text: `Hi ${profile.display_name},\n\ndein Live-Slot startet bald:\n${new Date(slot.start_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })} (${slot.duration_minutes} min)\n\nReady to go live? Vergiss die Brand-Standards nicht.\n\nZOE Star Agency`,
      });
      stats.slots++;
    } catch (e: any) {
      stats.errors.push(`slot/${slot.id}: ${e.message}`);
    }
  }

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

  return NextResponse.json({
    success: true,
    stats,
    timestamp: now.toISOString(),
  });
}
