// Backstage-Metrics-Sync · Resolve + Validate + Upsert + Audit.
// Wird vom POST /api/sync/backstage-metrics aufgerufen.
//
// Quelle: TikTok LIVE Backstage (extern via Workstation-Playwright-Push).
// Ziel: Tabelle creator_monthly_metrics (1 Row pro profile_id + month).
// Idempotenz: ON CONFLICT (profile_id, month) DO UPDATE.
//
// Match-Strategie: profiles.tiktok_handle_normalized (Migration 0042) gegen
// normalisiertes handle aus dem Sync-Payload. Mehrdeutige oder fehlende
// Treffer landen NICHT im Insert, sondern in result.errors + Audit-Log.

import { createClient as createSrClient } from "@supabase/supabase-js";
import { writeAudit } from "@/lib/audit/log";

export interface BackstageRow {
  tiktok_username: string;            // raw, wie aus Backstage geliefert
  month: string;                       // ISO YYYY-MM-01
  valid_live_days: number;
  live_minutes_total: number;
  live_hours_display?: number | null;
  average_viewers: number;
  last_live_date?: string | null;      // ISO YYYY-MM-DD
  activity_status?: "aktiv" | "unregelmaessig" | "inaktiv" | null;
  raw_snapshot?: Record<string, unknown>;
}

export interface SyncError {
  handle: string;
  month: string | null;
  reason: string;
}

export interface SyncResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: SyncError[];
}

const ALLOWED_STATUS = new Set(["aktiv", "unregelmaessig", "inaktiv"]);
const MONTH_RE = /^\d{4}-\d{2}-01$/;

function srClient() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Normalisierungs-Pipeline (Reihenfolge bewusst, deckt sich 1:1 mit der
// generierten Spalte profiles.tiktok_handle_normalized aus Migration 0042):
//   1) ALLEN whitespace strippen (auch Tabs, Newlines, innenliegende Spaces)
//   2) lower()
//   3) fuehrendes @ entfernen
export function normalizeHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, "").toLowerCase().replace(/^@/, "");
}

// Fallback wenn Backstage activity_status nicht liefert.
// Schwellen orientieren sich an gaengiger Backstage-Logik:
//   >= 5 gueltige Tage = aktiv, 1-4 = unregelmaessig, 0 = inaktiv.
function deriveActivityStatus(
  validLiveDays: number,
): "aktiv" | "unregelmaessig" | "inaktiv" {
  if (validLiveDays >= 5) return "aktiv";
  if (validLiveDays >= 1) return "unregelmaessig";
  return "inaktiv";
}

export async function syncBackstageMetrics(
  rows: BackstageRow[],
): Promise<SyncResult> {
  const sb = srClient();
  const result: SyncResult = {
    total: rows.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  // Pre-Flight: Migration 0042 muss in Production applied sein, sonst stiller Skip.
  // Ein .limit(0)-Select gibt error wenn die Spalte fehlt — wir crashen explizit
  // statt 0 Matches zu produzieren (Codex-P3-Hint).
  const { error: preflightErr } = await sb
    .from("profiles")
    .select("tiktok_handle_normalized")
    .limit(0);
  if (preflightErr) {
    throw new Error(
      `preflight failed: profiles.tiktok_handle_normalized missing? (${preflightErr.message})`,
    );
  }

  for (const row of rows) {
    const rawHandle = row?.tiktok_username ?? "";
    const month = row?.month ?? null;

    // Validation: Pflichtfelder
    if (!rawHandle || !month) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: "missing tiktok_username or month",
      });
      result.skipped++;
      continue;
    }
    if (!MONTH_RE.test(month)) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: "month must be ISO YYYY-MM-01",
      });
      result.skipped++;
      continue;
    }

    const normalized = normalizeHandle(rawHandle);
    if (!normalized) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: "empty handle after normalization",
      });
      result.skipped++;
      continue;
    }

    // Resolve profile_id via normalized-handle Index (Migration 0042)
    const { data: profiles, error: profErr } = await sb
      .from("profiles")
      .select("id")
      .eq("tiktok_handle_normalized", normalized);

    if (profErr) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: `profile lookup failed: ${profErr.message}`,
      });
      result.skipped++;
      continue;
    }
    if (!profiles || profiles.length === 0) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: `no profile match for handle "${normalized}"`,
      });
      result.skipped++;
      continue;
    }
    if (profiles.length > 1) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: `ambiguous match (${profiles.length} profiles): ${profiles.map((p) => p.id).join(",")}`,
      });
      result.skipped++;
      continue;
    }
    const profileId = profiles[0].id as string;

    // Sanity-clip + status-Fallback
    const validLiveDays = Math.max(0, Math.floor(Number(row.valid_live_days) || 0));
    const liveMinutes = Math.max(0, Math.floor(Number(row.live_minutes_total) || 0));
    const avgViewers = Math.max(0, Math.floor(Number(row.average_viewers) || 0));
    const status =
      row.activity_status && ALLOWED_STATUS.has(row.activity_status)
        ? row.activity_status
        : deriveActivityStatus(validLiveDays);
    const liveHoursDisplay =
      row.live_hours_display !== undefined && row.live_hours_display !== null
        ? Number(row.live_hours_display)
        : Number((liveMinutes / 60).toFixed(1));

    // Insert vs Update unterscheiden (fuer Counter im Result)
    const { data: existing } = await sb
      .from("creator_monthly_metrics")
      .select("id")
      .eq("profile_id", profileId)
      .eq("month", month)
      .maybeSingle();

    const { error: upsertErr } = await sb
      .from("creator_monthly_metrics")
      .upsert(
        {
          profile_id: profileId,
          tiktok_username: rawHandle,
          month,
          valid_live_days: validLiveDays,
          live_minutes_total: liveMinutes,
          live_hours_display: liveHoursDisplay,
          average_viewers: avgViewers,
          last_live_date: row.last_live_date ?? null,
          activity_status: status,
          raw_snapshot: row.raw_snapshot ?? null,
          source: "backstage",
          synced_at: new Date().toISOString(),
          error_message: null,
        },
        { onConflict: "profile_id,month" },
      );

    if (upsertErr) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: `upsert failed: ${upsertErr.message}`,
      });
      result.skipped++;
      continue;
    }

    if (existing) result.updated++;
    else result.inserted++;
  }

  // Audit-Log fire-and-forget (Cap auf 50 errors im payload, sonst Bloat)
  await writeAudit({
    actorId: null,
    actorRole: "system",
    action: "metrics.sync.run",
    targetTable: "creator_monthly_metrics",
    targetId: null,
    payload: {
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      error_count: result.errors.length,
      errors: result.errors.slice(0, 50),
    },
    ok: result.errors.length === 0,
    errorMsg:
      result.errors.length > 0 ? `${result.errors.length} rows failed` : null,
  });

  return result;
}
