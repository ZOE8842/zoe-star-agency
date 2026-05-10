// V2 Worker · Cron-Endpoint
// Wird von Vercel-Cron alle 5 min angepingt. Holt pending Account-Analysen
// und LIVE-Performance-Reports und arbeitet sie ab.
//
// Manuell triggerbar via:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://www.zoe-star.de/api/cron/analyse-worker

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { runWorkerBatch } from "@/lib/analyse/worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel-Cron-Limit ohne Bezahl-Plan ist 60s. Worker macht max 5+5 Analyse-Calls
// pro Run. Bei langsamer Claude-API kann das knapp werden — wenn ja, max-Limits
// runtersetzen oder pro Run nur 2+2 verarbeiten.
export const maxDuration = 60;

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

  const url = new URL(request.url);
  const maxA = Math.max(1, Math.min(10, Number(url.searchParams.get("maxAccount") ?? 3)));
  const maxL = Math.max(1, Math.min(10, Number(url.searchParams.get("maxLive") ?? 3)));

  const result = await runWorkerBatch(supabase, { maxAccount: maxA, maxLive: maxL });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    processed: {
      account: result.account.length,
      live: result.live.length,
    },
    failed: {
      account: result.account.filter((r) => !r.ok).length,
      live: result.live.filter((r) => !r.ok).length,
    },
    total_cost_usd: Number(result.total_cost_usd.toFixed(4)),
    details: { account: result.account, live: result.live },
  });
}

// POST mit { id, kind } um eine einzelne Analyse manuell zu triggern
// (z.B. aus Admin-UI). Kind = "account" | "live".
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  let body: { id?: string; kind?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { id, kind } = body;
  if (!id || (kind !== "account" && kind !== "live")) {
    return NextResponse.json({ error: "id + kind ('account' | 'live') erforderlich" }, { status: 400 });
  }

  const { processAccountAnalysis, processLiveReport } = await import("@/lib/analyse/worker");
  const r =
    kind === "account"
      ? await processAccountAnalysis(supabase, id)
      : await processLiveReport(supabase, id);

  return NextResponse.json(r);
}
