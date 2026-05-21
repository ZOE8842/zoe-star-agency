// POST /api/sync/backstage-revenue
// Push-Senke fuer Backstage-Anreize (Activity · Tier · Incremental · Forecast · Missing).
// Auth: Bearer <BACKSTAGE_SYNC_BEARER>. Admin-only Data.
//
// V12.3-Codex-Hardening (2026-05-16):
//   - Alle Revenue-/Diamonds-Felder .nonnegative() (kein negativer Bonus erlaubt)
//   - generischer 500-Error (kein Leak von Stack/Env in Response)
//   - Body-Size-Check via Header + Streaming-Cap im Read (Chunked-Schutz)

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
  // Alle Revenue-/Diamonds-/Forecast-Felder sind nicht-negativ.
  // Backstage liefert nie negative Bonuses oder Diamanten.
  activity_revenue_usd:    z.number().finite().nonnegative().nullable().optional(),
  tier_revenue_usd:        z.number().finite().nonnegative().nullable().optional(),
  incremental_revenue_usd: z.number().finite().nonnegative().nullable().optional(),
  total_revenue_usd:       z.number().finite().nonnegative().nullable().optional(),
  last_period_total_usd:   z.number().finite().nonnegative().nullable().optional(),
  forecast_revenue_usd:    z.number().finite().nonnegative().nullable().optional(),
  forecast_diamonds:       z.number().finite().nonnegative().nullable().optional(),
  forecast_bonus_usd:      z.number().finite().nonnegative().nullable().optional(),
  missing_revenue_usd:     z.number().finite().nonnegative().nullable().optional(),
  missing_diamonds:        z.number().finite().nonnegative().nullable().optional(),
  missing_next_tier_label: z.string().nullable().optional(),
  missing_status:          z.enum(["near","critical","reached","none"]).nullable().optional(),
  // V12.8 Legacy-Felder (Pre-Maerz Bonusprogramm · Migration 0049)
  legacy_revenue_usd:        z.number().finite().nonnegative().nullable().optional(),
  legacy_activity_usd:       z.number().finite().nonnegative().nullable().optional(),
  legacy_incremental_usd:    z.number().finite().nonnegative().nullable().optional(),
  legacy_beginner_bonus_usd: z.number().finite().nonnegative().nullable().optional(),
  legacy_program_label:      z.string().nullable().optional(),
  // C₁ Phase · Source-of-Truth + DOM-Detail-Felder (Migration 0057)
  // R13: Level/Ratio kommen direkt aus DOM, defensive Ranges aus Master-Prompt-Tabellen.
  estimated_bonus_usd:        z.number().finite().nonnegative().nullable().optional(),
  tier_current_level:         z.number().int().min(1).max(10).nullable().optional(),
  tier_progress_diamonds:     z.number().int().nonnegative().nullable().optional(),
  tier_target_diamonds:       z.number().int().nonnegative().nullable().optional(),
  tier_status:                z.string().max(200).nullable().optional(),
  activity_current_level:     z.number().int().min(1).max(5).nullable().optional(),
  activity_bonus_ratio:       z.number().min(0).max(0.05).nullable().optional(),
  activity_status:            z.string().max(200).nullable().optional(),
  incremental_status:         z.string().max(500).nullable().optional(),
  match_diamonds:             z.number().int().nonnegative().nullable().optional(),
  eligible_incentives_count:  z.number().int().min(0).max(20).nullable().optional(),
  source_schema_version:      z.string().max(50).nullable().optional(),
  raw_snapshot:            z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  rows: z.array(RevenueRowSchema).min(1).max(MAX_ROWS_PER_BATCH),
  // Freeze-Override: wenn true, ueberschreibt auch vergangene Monate.
  // Nur fuer Manual-Rebuild via History-Loader o.ae.
  force: z.boolean().optional(),
});

async function readBodyWithCap(request: NextRequest): Promise<unknown> {
  // Codex-MEDIUM-Fix: Body via Stream lesen + harte Byte-Cap. Schuetzt vor
  // Chunked-Transfer der Content-Length-Pre-Check umgeht.
  const reader = request.body?.getReader();
  if (!reader) {
    // Kein Body-Stream → trotzdem versuchen via .json()
    return await request.json();
  }
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.length;
      if (total > MAX_BODY_BYTES) {
        throw new Error("body_too_large");
      }
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

  // Header-Pre-Check (best-effort)
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: `body too large (max ${MAX_BODY_BYTES} bytes)` }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await readBodyWithCap(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid body";
    if (msg === "body_too_large") {
      return NextResponse.json({ error: `body too large (max ${MAX_BODY_BYTES} bytes)` }, { status: 413 });
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

  // C₁ Phase · Latente Drift-Detection (kein User-facing UI · R12)
  // Wenn estimated_bonus_usd vom Scraper geliefert wird, prüfen wir ob
  // unsere Summe activity+tier+incremental signifikant abweicht.
  // > 5 % → Sentry-Warning (Notbremse, kein Push-Reject).
  for (const r of parsed.data.rows) {
    if (r.estimated_bonus_usd != null && r.estimated_bonus_usd > 0) {
      const sum =
        (r.activity_revenue_usd ?? 0) +
        (r.tier_revenue_usd ?? 0) +
        (r.incremental_revenue_usd ?? 0);
      const driftUsd = Math.abs(r.estimated_bonus_usd - sum);
      const driftPct = driftUsd / r.estimated_bonus_usd * 100;
      if (driftPct > 5) {
        // Codex-Review-Fix · LOW: normalized handle für konsistentes Filtering
        const normalizedTag = (r.tiktok_username || "")
          .replace(/\s+/g, "")
          .toLowerCase()
          .replace(/^@/, "");
        Sentry.captureMessage(
          `Revenue drift > 5% for ${r.tiktok_username}: ` +
          `tiktok=${r.estimated_bonus_usd.toFixed(2)} zoe=${sum.toFixed(2)} ` +
          `(${driftPct.toFixed(2)}%)`,
          {
            level: "warning",
            tags: {
              source: "backstage-revenue-drift",
              period: r.period_month,
              handle: normalizedTag,
            },
          },
        );
      }
    }
  }

  try {
    const result = await syncBackstageRevenue(
      parsed.data.rows as RevenueRow[],
      { force: parsed.data.force },
    );
    return NextResponse.json(result);
  } catch (e) {
    // Codex-MEDIUM-Fix: generischer Error · keine Internals leaken
    const msg = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e);
    console.error("[sync/backstage-revenue] crash:", msg);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
