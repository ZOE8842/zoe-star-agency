// Birthday-Reminder-Cron
// Daily 06:00 UTC: scannt profiles auf birthday_day/birthday_month
// und schreibt zwei Sorten Dashboard-News:
// - HEUTE: "Heute hat <Name> Geburtstag"
// - MORGEN: "Morgen hat <Name> Geburtstag"
//
// Dedupe-Schutz via dashboard_news.dedupe_key:
//   birthday:<profile_id>:<year>:today
//   birthday:<profile_id>:<year>:tomorrow
//
// Admin bekommt zusaetzlich Inbox-Notification fuer "morgen"-Birthday-Liste.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const VISIBLE_HOURS = 36; // ein bisschen ueber 24h, damit der heutige Eintrag erst am uebernaechsten Tag verschwindet

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const now = new Date();
  const year = now.getUTCFullYear();
  const todayDay = now.getUTCDate();
  const todayMonth = now.getUTCMonth() + 1;

  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomDay = tomorrow.getUTCDate();
  const tomMonth = tomorrow.getUTCMonth() + 1;

  // Heutige + morgige Geburtstage in einem Query
  const { data: bdayRows, error } = await supabase
    .from("profiles")
    .select("id, display_name, tiktok_username, birthday_day, birthday_month, status")
    .eq("status", "active")
    .or(
      `and(birthday_day.eq.${todayDay},birthday_month.eq.${todayMonth}),and(birthday_day.eq.${tomDay},birthday_month.eq.${tomMonth})`,
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const todayPeople = (bdayRows ?? []).filter(
    (p) => p.birthday_day === todayDay && p.birthday_month === todayMonth,
  );
  const tomPeople = (bdayRows ?? []).filter(
    (p) => p.birthday_day === tomDay && p.birthday_month === tomMonth,
  );

  const visibleUntil = new Date(now.getTime() + VISIBLE_HOURS * 3600 * 1000).toISOString();
  const inserts: Array<{
    type: "birthday_today" | "birthday_tomorrow";
    title: string;
    body: string;
    profile_id: string;
    tiktok_username: string | null;
    tiktok_url: string | null;
    visible_until: string;
    dedupe_key: string;
  }> = [];

  for (const p of todayPeople) {
    const tikUrl = p.tiktok_username
      ? `https://www.tiktok.com/@${p.tiktok_username.replace(/^@/, "")}`
      : null;
    inserts.push({
      type: "birthday_today",
      title: `🎉 Heute hat ${p.display_name || "ein Creator"} Geburtstag`,
      body: "Schickt ihr gerne Glueckwuensche.",
      profile_id: p.id,
      tiktok_username: p.tiktok_username,
      tiktok_url: tikUrl,
      visible_until: visibleUntil,
      dedupe_key: `birthday:${p.id}:${year}:today`,
    });
  }
  for (const p of tomPeople) {
    const tikUrl = p.tiktok_username
      ? `https://www.tiktok.com/@${p.tiktok_username.replace(/^@/, "")}`
      : null;
    inserts.push({
      type: "birthday_tomorrow",
      title: `🎂 Morgen hat ${p.display_name || "ein Creator"} Geburtstag`,
      body: "Nicht vergessen.",
      profile_id: p.id,
      tiktok_username: p.tiktok_username,
      tiktok_url: tikUrl,
      visible_until: visibleUntil,
      dedupe_key: `birthday:${p.id}:${year}:tomorrow`,
    });
  }

  let created = 0;
  let skipped = 0;
  for (const row of inserts) {
    const { error: insErr } = await supabase.from("dashboard_news").insert(row);
    if (insErr) {
      // Unique-Conflict auf dedupe_key → schon vorhanden, ueberspringen
      if (insErr.message.includes("duplicate") || insErr.message.includes("dedupe")) {
        skipped++;
        continue;
      }
      // andere Fehler ignorieren — best-effort
      skipped++;
      continue;
    }
    created++;
  }

  // Admin-Inbox-Reminder fuer "morgen"-Birthdays — eine Notification pro Admin pro Tag
  // Dedupe via link-Pattern, damit mehrfache Cron-Runs am selben Tag nicht spammen
  if (tomPeople.length > 0) {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("status", "active");
    const names = tomPeople.map((p) => p.display_name || "—").join(", ");
    const dedupLink = `/portal/admin#birthday-tomorrow-${now.toISOString().slice(0, 10)}`;
    const adminIds = (admins ?? []).map((a) => a.id);
    const { data: existingDups } = adminIds.length > 0
      ? await supabase
          .from("notifications")
          .select("user_id")
          .eq("type", "reminder")
          .eq("link", dedupLink)
          .in("user_id", adminIds)
      : { data: [] };
    const dupSet = new Set((existingDups ?? []).map((d) => d.user_id));

    for (const a of admins ?? []) {
      if (dupSet.has(a.id)) continue;
      await supabase.from("notifications").insert({
        user_id: a.id,
        type: "reminder",
        title: `🎂 Morgen Geburtstag: ${names}`,
        body: "Glueckwuensche vorbereiten.",
        link: dedupLink,
      }).then(() => undefined, () => undefined);
    }
  }

  // Audit-Log
  await supabase.from("data_source_health").insert({
    source: "claude_worker",
    kind: "birthday_reminder",
    ok: true,
    count_items: created,
    payload: {
      today: todayPeople.length,
      tomorrow: tomPeople.length,
      created,
      skipped,
    },
  }).then(() => undefined, () => undefined);

  return NextResponse.json({
    success: true,
    today_count: todayPeople.length,
    tomorrow_count: tomPeople.length,
    created,
    skipped,
  });
}
