// POST /api/sync/backstage-daily-metrics
// Push-Senke fuer Backstage-DAILY-Metrics (pro Creator + Tag).
// Auth: Bearer <BACKSTAGE_SYNC_BEARER> (fail-closed).
// Body: { rows: DailyRow[] } (max 5000 pro Batch, max 2 MB).
// Ergebnis: DailySyncResult mit Counters + Errors.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { checkSyncAuth } from "@/lib/security/sync-auth";
import {
  syncBackstageDailyMetrics,
  type DailyRow,
} from "@/lib/sync/backstage-daily-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS_PER_BATCH = 5000;     // 52 Creator × ~31 Tage = ~1600 Rows max
const MAX_BODY_BYTES = 2_000_000;    // 2 MB

const DailyRowSchema = z.object({
  tiktok_username: z.string().min(1),
  metric_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "metric_date must be ISO YYYY-MM-DD"),
  diamonds:              z.number().finite().nonnegative().nullable().optional(),
  live_minutes:          z.number().finite().nonnegative().nullable().optional(),
  viewers:               z.number().finite().nonnegative().nullable().optional(),
  impressions:           z.number().finite().nonnegative().nullable().optional(),
  live_views:            z.number().finite().nonnegative().nullable().optional(),
  ctr:                   z.number().finite().nonnegative().nullable().optional(),
  watchtime_avg_seconds: z.number().finite().nonnegative().nullable().optional(),
  new_followers:         z.number().finite().nonnegative().nullable().optional(),
  gifts:                 z.number().finite().nonnegative().nullable().optional(),
  gifters:               z.number().finite().nonnegative().nullable().optional(),
  gift_rate:             z.number().finite().nonnegative().nullable().optional(),
  raw_snapshot:          z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  rows: z.array(DailyRowSchema).min(1).max(MAX_ROWS_PER_BATCH),
});

export async function POST(request: NextRequest) {
  const authResp = checkSyncAuth(request);
  if (authResp) return authResp;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `body too large (max ${MAX_BODY_BYTES} bytes)` },
      { status: 413 },
    );
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
    const result = await syncBackstageDailyMetrics(parsed.data.rows as DailyRow[]);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e);
    console.error("[sync/backstage-daily-metrics] crash:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
