// V2 Worker · Cron-Endpoint
// Wird von Vercel-Cron alle 5 min angepingt. Holt pending Account-Analysen
// und LIVE-Performance-Reports und arbeitet sie ab.
//
// Manuell triggerbar via:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://www.zoe-star.de/api/cron/analyse-worker

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
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
  const maxC = Math.max(1, Math.min(10, Number(url.searchParams.get("maxContent") ?? 3)));

  const result = await runWorkerBatch(supabase, { maxAccount: maxA, maxLive: maxL, maxContent: maxC });

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    processed: {
      account: result.account.length,
      live: result.live.length,
      content: result.content.length,
    },
    failed: {
      account: result.account.filter((r) => !r.ok).length,
      live: result.live.filter((r) => !r.ok).length,
      content: result.content.filter((r) => !r.ok).length,
    },
    total_cost_usd: Number(result.total_cost_usd.toFixed(4)),
    details: { account: result.account, live: result.live, content: result.content },
  });
}

// POST mit { id, kind } um eine einzelne Analyse manuell zu triggern
// (z.B. aus Admin-UI). Kind = "account" | "live" | "content_review".
//
// Antwortet sofort mit 202 Accepted und arbeitet die eigentliche Analyse
// in `after()` ab. Damit blockiert der Aufrufer (Server Action) nicht auf
// dem Anthropic-Call. Der Worker hat seine eigenen maxDuration=60s.
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

  let body: { id?: string; kind?: string; sync?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { id, kind, sync } = body;
  if (!id || (kind !== "account" && kind !== "live" && kind !== "content_review")) {
    return NextResponse.json({ error: "id + kind ('account' | 'live' | 'content_review') erforderlich" }, { status: 400 });
  }

  const { processAccountAnalysis, processLiveReport, processContentReview } = await import("@/lib/analyse/worker");

  // sync=true: alter sync-Pfad (fuer Tests / Cron-Selbsttrigger)
  if (sync) {
    const r =
      kind === "account"
        ? await processAccountAnalysis(supabase, id)
        : kind === "live"
        ? await processLiveReport(supabase, id)
        : await processContentReview(supabase, id);
    return NextResponse.json(r);
  }

  // Default: async via after() — Caller wird nicht geblockt.
  after(async () => {
    try {
      if (kind === "account") {
        await processAccountAnalysis(supabase, id);
      } else if (kind === "live") {
        await processLiveReport(supabase, id);
      } else {
        await processContentReview(supabase, id);
      }
    } catch (e) {
      // Worker hat eigenes try/catch + failed-Write; hier nur Fallback-Log.
      console.error("[analyse-worker] after() processing failed:", e);
    }
  });

  return NextResponse.json({ accepted: true, id, kind }, { status: 202 });
}
