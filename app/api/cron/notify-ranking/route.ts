// POST /api/cron/notify-ranking
// Erzeugt fuer ALLE aktiven Creator eine Notification "Tagesranking verfuegbar"
// + sendet Web-Push.
// Geschuetzt mit CRON_SECRET (Vercel-Cron Bearer-Auth).
//
// CDX-1 Updates:
//   - maxDuration=60 (vorher fehlte → Vercel-Default 10s → Function-Kill bei
//     34+ Creator und je 500ms+ Notification-Latenz).
//   - data_source_health-Insert IMMER (success/skip/fail) damit Pipeline-
//     Health-Sicht nicht silent ist.
//   - Notification-Gate: skip wenn creator_daily_metrics fuer den
//     target_date weniger als INSUFFICIENT_RANKING_THRESHOLD Rows hat.
//     Skip ist KEIN FAIL — ok=true, error_message=null, payload.status='skipped'.
//
// Kann optional auch von Python (send_ranking_stories.py) nach erfolgreichem
// Stories-Render gepostet werden -> dann sehen Creator die Notification
// gleich mit dem Telegram-Push fuer Nesip parallel.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications/center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// CDX-1: Schwellwert fuer Notification-Gate. Unter diesem Wert (Anzahl
// creator_daily_metrics-Rows fuer den target_date) wird KEIN Push gesendet,
// weil das Ranking nicht vollstaendig ist. Verhindert "Push -> leeres Ranking".
const INSUFFICIENT_RANKING_THRESHOLD = 30;

/**
 * target_date in Europe/Berlin Logik analog /share/tagesranking:
 * notify-ranking laeuft per Cron 12:05 UTC = 14:05 Berlin (nach 12h Berlin)
 * → target_date = today (Berlin) - 1.
 * Manual-Trigger kann auch frueh am Tag erfolgen — dann nehmen wir den
 * gleichen Fall (D-1), weil notify-ranking nur D-1-Daten signalisiert.
 */
function targetDateBerlinIso(): string {
  const now = new Date();
  // Berlin-Datum als YYYY-MM-DD (en-CA liefert exakt das ISO-Format).
  const todayBerlin = now.toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });
  const d = new Date(`${todayBerlin}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;

async function recordHealth(
  db: Sb,
  body: {
    ok: boolean;
    count_items: number;
    error_message: string | null;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .from("data_source_health")
    .insert({
      source: "claude_worker",
      kind: "notify_ranking",
      ok: body.ok,
      count_items: body.count_items,
      error_message: body.error_message,
      payload: body.payload,
    })
    .then(() => undefined, () => undefined);
}

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

  // ── CDX-1 Notification-Gate ─────────────────────────────────
  const targetDate = targetDateBerlinIso();
  const { count: rankingRowCount, error: gateErr } = await db
    .from("creator_daily_metrics")
    .select("metric_date", { head: true, count: "exact" })
    .eq("metric_date", targetDate);

  if (gateErr) {
    await recordHealth(db, {
      ok: false,
      count_items: 0,
      error_message: `gate query failed: ${gateErr.message}`,
      payload: { target_date: targetDate, stage: "gate" },
    });
    return NextResponse.json({ error: gateErr.message }, { status: 500 });
  }

  const rows = rankingRowCount ?? 0;
  if (rows < INSUFFICIENT_RANKING_THRESHOLD) {
    // Bewusster Skip — kein Push, kein FAIL.
    await recordHealth(db, {
      ok: true,
      count_items: rows,
      error_message: null,
      payload: {
        status: "skipped",
        reason: "insufficient_ranking_data",
        target_date: targetDate,
        threshold: INSUFFICIENT_RANKING_THRESHOLD,
        rows_found: rows,
      },
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "insufficient_ranking_data",
      target_date: targetDate,
      threshold: INSUFFICIENT_RANKING_THRESHOLD,
      rows_found: rows,
    });
  }

  // ── Creator-Liste holen ──────────────────────────────────────
  const { data: creators, error } = await db
    .from("profiles")
    .select("id")
    .eq("role", "creator")
    .eq("status", "active");

  if (error) {
    await recordHealth(db, {
      ok: false,
      count_items: 0,
      error_message: `creators query failed: ${error.message}`,
      payload: { target_date: targetDate, stage: "fetch_creators" },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!creators?.length) {
    await recordHealth(db, {
      ok: true,
      count_items: 0,
      error_message: null,
      payload: {
        status: "skipped",
        reason: "no_active_creators",
        target_date: targetDate,
      },
    });
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // ── Notifications ────────────────────────────────────────────
  const results = await Promise.allSettled(
    creators.map((c) =>
      createNotification({
        user_id: c.id,
        type: "ranking_ready",
        title: "Tagesranking ist da",
        body: "Top 3 je Kategorie - schau wer heute vorne ist.",
        target_url: "/portal/admin/ranking",
        metadata: { source: "cron_notify-ranking", target_date: targetDate },
      }),
    ),
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const total = creators.length;
  const failed = total - sent;
  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .slice(0, 5)
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));

  const ok = failed === 0;
  await recordHealth(db, {
    ok,
    count_items: sent,
    error_message: ok
      ? null
      : `partial notify failure: ${failed}/${total} failed${
          failures.length > 0 ? ` · ${failures.slice(0, 2).join(" | ")}` : ""
        }`,
    payload: {
      status: ok ? "sent" : "partial",
      target_date: targetDate,
      total,
      sent,
      failed,
      sample_errors: failures,
    },
  });

  return NextResponse.json({ ok, sent, total, target_date: targetDate });
}

// Vercel-Cron sendet per Default GET. Manual-Trigger geht via POST.
// Beide brauchen Bearer-Auth gegen CRON_SECRET.
export async function GET(req: NextRequest)  { return trigger(req); }
export async function POST(req: NextRequest) { return trigger(req); }
