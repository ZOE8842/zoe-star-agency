// POST /api/cron/notify-ranking
// Erzeugt fuer ALLE aktiven Creator eine Notification "Tagesranking verfuegbar"
// + sendet Web-Push.
// Geschuetzt mit CRON_SECRET (Vercel-Cron Bearer-Auth).
//
// Kann optional auch von Python (send_ranking_stories.py) nach erfolgreichem
// Stories-Render gepostet werden -> dann sehen Creator die Notification
// gleich mit dem Telegram-Push fuer Nesip parallel.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications/center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function trigger(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: creators, error } = await db
    .from("profiles")
    .select("id")
    .eq("role", "creator")
    .eq("status", "active");

  if (error)            return NextResponse.json({ error: error.message }, { status: 500 });
  if (!creators?.length) return NextResponse.json({ ok: true, sent: 0 });

  const results = await Promise.allSettled(creators.map(c => createNotification({
    user_id: c.id,
    type: "ranking_ready",
    title: "Tagesranking ist da",
    body: "Top 3 je Kategorie - schau wer heute vorne ist.",
    target_url: "/portal/admin/ranking",
    metadata: { source: "cron_notify-ranking" },
  })));

  const sent = results.filter(r => r.status === "fulfilled" && r.value).length;
  return NextResponse.json({ ok: true, sent, total: creators.length });
}

// Vercel-Cron sendet per Default GET. Manual-Trigger geht via POST.
// Beide brauchen Bearer-Auth gegen CRON_SECRET.
export async function GET(req: NextRequest)  { return trigger(req); }
export async function POST(req: NextRequest) { return trigger(req); }
