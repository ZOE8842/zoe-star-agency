// POST /api/sync/backstage-metrics
// Externe Push-Senke fuer Backstage-Metrics-Sync.
// Auth: Authorization: Bearer <BACKSTAGE_SYNC_BEARER> (fail-closed, 503 wenn unset).
// Body: { rows: BackstageRow[] } (max 1000 pro Batch, max 1 MB).
// Ergebnis: SyncResult mit Counters + Errors.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { checkSyncAuth } from "@/lib/security/sync-auth";
import {
  syncBackstageMetrics,
  type BackstageRow,
} from "@/lib/sync/backstage-metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS_PER_BATCH = 1000;
const MAX_BODY_BYTES = 1_000_000; // 1 MB

const RowSchema = z.object({
  tiktok_username: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, "month must be ISO YYYY-MM-01"),
  valid_live_days: z.number().finite().nonnegative(),
  live_minutes_total: z.number().finite().nonnegative(),
  live_hours_display: z.number().finite().nonnegative().nullable().optional(),
  average_viewers: z.number().finite().nonnegative(),
  last_live_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "last_live_date must be ISO YYYY-MM-DD")
    .nullable()
    .optional(),
  activity_status: z
    .enum(["aktiv", "unregelmaessig", "inaktiv"])
    .nullable()
    .optional(),
  // Phase-5-KPIs (Migration 0044) · alle optional/nullable, additive
  diamonds_month:        z.number().finite().nonnegative().nullable().optional(),
  gift_rate:             z.number().finite().nonnegative().nullable().optional(),
  impressions:           z.number().finite().nonnegative().nullable().optional(),
  live_views:            z.number().finite().nonnegative().nullable().optional(),
  followers_gained:      z.number().finite().nonnegative().nullable().optional(),
  ctr:                   z.number().finite().nonnegative().nullable().optional(),
  watchtime_avg_seconds: z.number().finite().nonnegative().nullable().optional(),
  streams_count:         z.number().finite().nonnegative().nullable().optional(),
  gifts_count:           z.number().finite().nonnegative().nullable().optional(),
  gifters_count:         z.number().finite().nonnegative().nullable().optional(),
  raw_snapshot: z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  rows: z.array(RowSchema).min(1).max(MAX_ROWS_PER_BATCH),
});

export async function POST(request: NextRequest) {
  const authResp = checkSyncAuth(request);
  if (authResp) return authResp;

  // Pre-flight body-size: blockiere riesige Payloads bevor request.json() laeuft.
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
      {
        error: "invalid body schema",
        issues: parsed.error.issues.slice(0, 20),
      },
      { status: 400 },
    );
  }

  try {
    const result = await syncBackstageMetrics(
      parsed.data.rows as BackstageRow[],
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e);
    console.error("[sync/backstage-metrics] crash:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
