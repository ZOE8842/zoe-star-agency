// POST /api/sync/backstage-revenue
// Push-Senke fuer Backstage-Anreize (Activity · Tier · Incremental · Forecast · Missing).
// Auth: Bearer <BACKSTAGE_SYNC_BEARER>. Admin-only Data.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { checkSyncAuth } from "@/lib/security/sync-auth";
import { syncBackstageRevenue, type RevenueRow } from "@/lib/sync/backstage-revenue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS_PER_BATCH = 500;
const MAX_BODY_BYTES = 500_000;

const RevenueRowSchema = z.object({
  tiktok_username: z.string().min(1),
  period_month: z.string().regex(/^\d{4}-\d{2}-01$/, "period_month must be ISO YYYY-MM-01"),
  activity_revenue_usd:    z.number().finite().nullable().optional(),
  tier_revenue_usd:        z.number().finite().nullable().optional(),
  incremental_revenue_usd: z.number().finite().nullable().optional(),
  total_revenue_usd:       z.number().finite().nullable().optional(),
  last_period_total_usd:   z.number().finite().nullable().optional(),
  forecast_revenue_usd:    z.number().finite().nullable().optional(),
  forecast_diamonds:       z.number().finite().nonnegative().nullable().optional(),
  forecast_bonus_usd:      z.number().finite().nullable().optional(),
  missing_revenue_usd:     z.number().finite().nullable().optional(),
  missing_diamonds:        z.number().finite().nonnegative().nullable().optional(),
  missing_next_tier_label: z.string().nullable().optional(),
  missing_status:          z.enum(["near","critical","reached","none"]).nullable().optional(),
  raw_snapshot:            z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  rows: z.array(RevenueRowSchema).min(1).max(MAX_ROWS_PER_BATCH),
  // Freeze-Override: wenn true, ueberschreibt auch vergangene Monate.
  // Nur fuer Manual-Rebuild via History-Loader o.ae.
  force: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const authResp = checkSyncAuth(request);
  if (authResp) return authResp;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: `body too large (max ${MAX_BODY_BYTES} bytes)` }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body schema", issues: parsed.error.issues.slice(0, 20) },
      { status: 400 },
    );
  }

  try {
    const result = await syncBackstageRevenue(
      parsed.data.rows as RevenueRow[],
      { force: parsed.data.force },
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e);
    console.error("[sync/backstage-revenue] crash:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
