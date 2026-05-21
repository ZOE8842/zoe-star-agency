// POST /api/sync/backstage-live-performance
// Push-Senke für Backstage LIVE-Leistung Kernsignale.
// Auth: Bearer <BACKSTAGE_SYNC_BEARER>. Admin-only Data.
//
// Phase C₂ · Migration 0058 · Spec 03_Umsatz_Reiter/00_Workflow.md §6.4.
// R17: Incentive-Kontext-Schicht, NICHT LIVE-Analytics.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { checkSyncAuth } from "@/lib/security/sync-auth";
import {
  syncBackstageLivePerformance,
  type LivePerformanceRow,
} from "@/lib/sync/backstage-live-performance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS_PER_BATCH = 500;
const MAX_BODY_BYTES = 500_000;

const LivePerformanceRowSchema = z.object({
  tiktok_username: z.string().min(1),
  period_month: z.string().regex(/^\d{4}-\d{2}-01$/, "period_month must be ISO YYYY-MM-01"),

  current_diamonds:      z.number().int().nonnegative().nullable().optional(),
  live_valid_days:       z.number().int().min(0).max(31).nullable().optional(),
  live_duration_seconds: z.number().int().nonnegative().nullable().optional(),
  livestreams_count:     z.number().int().nonnegative().nullable().optional(),
  new_followers:         z.number().int().nonnegative().nullable().optional(),
  avg_watch_seconds:     z.number().int().nonnegative().nullable().optional(),

  period_compare_start:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  period_compare_end:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  diamonds_compare:          z.number().int().nonnegative().nullable().optional(),
  // compare_pct kann signed sein (z.B. Ø Wiedergabezeit -22,91 %)
  diamonds_compare_pct:      z.number().finite().nullable().optional(),
  live_days_compare:         z.number().int().nonnegative().nullable().optional(),
  live_days_compare_pct:     z.number().finite().nullable().optional(),
  live_duration_compare_sec: z.number().int().nonnegative().nullable().optional(),
  live_duration_compare_pct: z.number().finite().nullable().optional(),
  streams_compare:           z.number().int().nonnegative().nullable().optional(),
  streams_compare_pct:       z.number().finite().nullable().optional(),
  followers_compare:         z.number().int().nonnegative().nullable().optional(),
  followers_compare_pct:     z.number().finite().nullable().optional(),
  watch_seconds_compare:     z.number().int().nonnegative().nullable().optional(),
  watch_seconds_compare_pct: z.number().finite().nullable().optional(),

  source_schema_version: z.string().max(50),
  raw_snapshot: z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  rows: z.array(LivePerformanceRowSchema).min(1).max(MAX_ROWS_PER_BATCH),
  force: z.boolean().optional(),
});

async function readBodyWithCap(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return await request.json();
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.length;
      if (total > MAX_BODY_BYTES) throw new Error("body_too_large");
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  const text = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(text);
}

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
    raw = await readBodyWithCap(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid body";
    if (msg === "body_too_large") {
      return NextResponse.json(
        { error: `body too large (max ${MAX_BODY_BYTES} bytes)` },
        { status: 413 },
      );
    }
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
    const result = await syncBackstageLivePerformance(
      parsed.data.rows as LivePerformanceRow[],
      { force: parsed.data.force },
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e);
    console.error("[sync/backstage-live-performance] crash:", msg);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
