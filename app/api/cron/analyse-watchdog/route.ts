// Analyse-Watchdog · CDX-1 Stop-the-Bleed
//
// Markiert "stuck" rows in account_analyses + content_reviews als failed.
// Lifecycle:
//   status='processing' + processing_started_at < NOW() - 5 min
//   -> status='failed' + error_message='watchdog: ...'
//
// Verhindert:
//   - ewig haengende Analysen wenn Vercel-Function nach maxDuration killed
//   - dauerhafte 'processing'-States im UI
//
// Schedule: vercel.json -> /api/cron/analyse-watchdog alle 5 min.
// Manuell: curl -H "Authorization: Bearer $CRON_SECRET"
//          https://www.zoe-star.de/api/cron/analyse-watchdog

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/security/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const STUCK_THRESHOLD_MINUTES = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recordHealth(
  supabase: any,
  ok: boolean,
  aaCount: number,
  crCount: number,
  errorMsg: string | null,
): Promise<void> {
  await supabase
    .from("data_source_health")
    .insert({
      source: "claude_worker",
      kind: "analyse_watchdog",
      ok,
      count_items: aaCount + crCount,
      error_message: errorMsg,
      payload: {
        threshold_minutes: STUCK_THRESHOLD_MINUTES,
        account_analyses_failed: aaCount,
        content_reviews_failed: crCount,
      },
    })
    .then(
      () => undefined,
      () => undefined,
    );
}

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const cutoffIso = new Date(
    Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000,
  ).toISOString();
  const stuckMsg = `watchdog: processing > ${STUCK_THRESHOLD_MINUTES}min (function-timeout-suspected)`;
  const nowIso = new Date().toISOString();

  // 1) account_analyses
  const { data: aa, error: aaErr } = await supabase
    .from("account_analyses")
    .update({
      status: "failed",
      error_message: stuckMsg,
      completed_at: nowIso,
    })
    .eq("status", "processing")
    .lt("processing_started_at", cutoffIso)
    .select("id");

  // 2) content_reviews
  const { data: cr, error: crErr } = await supabase
    .from("content_reviews")
    .update({
      status: "failed",
      error_message: stuckMsg,
      completed_at: nowIso,
    })
    .eq("status", "processing")
    .lt("processing_started_at", cutoffIso)
    .select("id");

  const aaCount = aa?.length ?? 0;
  const crCount = cr?.length ?? 0;

  if (aaErr || crErr) {
    const errorParts = [aaErr?.message, crErr?.message].filter(
      (m): m is string => !!m,
    );
    await recordHealth(
      supabase,
      false,
      aaCount,
      crCount,
      `watchdog query failed: ${errorParts.join(" | ")}`,
    );
    return NextResponse.json(
      {
        ok: false,
        threshold_minutes: STUCK_THRESHOLD_MINUTES,
        account_analyses_failed: aaCount,
        content_reviews_failed: crCount,
        error: errorParts.join(" | "),
      },
      { status: 500 },
    );
  }

  await recordHealth(supabase, true, aaCount, crCount, null);

  return NextResponse.json({
    ok: true,
    threshold_minutes: STUCK_THRESHOLD_MINUTES,
    account_analyses_failed: aaCount,
    content_reviews_failed: crCount,
  });
}
