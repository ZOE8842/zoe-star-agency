// Backstage LIVE-Performance Sync · Admin-only Incentive-Kontext-Schicht
// Wird vom POST /api/sync/backstage-live-performance aufgerufen.
//
// Quelle: TikTok LIVE Backstage Tab "LIVE-Leistung" (Diesen Monat)
// Ziel:   Tabelle creator_live_performance_monthly (Migration 0058)
// Idempotenz: ON CONFLICT (tiktok_handle_normalized, period_month) DO UPDATE.
//
// WICHTIG · R17 (System-Trennung):
//   Diese Lib ist die Incentive-Kontext-Schicht für den Umsatz-Reiter,
//   NICHT der Beginn eines LIVE-Analytics-Systems.
//
// RLS: nur Admin (clpm_admin_read).

import { createClient as createSrClient } from "@supabase/supabase-js";
import { writeAudit } from "@/lib/audit/log";
import { normalizeHandle } from "@/lib/sync/backstage-revenue";

export interface LivePerformanceRow {
  tiktok_username: string;
  period_month: string;                  // YYYY-MM-01

  // Kern-Performance (alle nullable · R2 Unknown ≠ 0)
  current_diamonds?: number | null;
  live_valid_days?: number | null;
  live_duration_seconds?: number | null;
  livestreams_count?: number | null;
  new_followers?: number | null;
  avg_watch_seconds?: number | null;

  // TikTok-eigener Compare-Window (R7 Rolling Comparison)
  // WICHTIG: NICHT voller Vormonat, sondern selbe Anzahl Tage rückwärts.
  period_compare_start?: string | null;  // YYYY-MM-DD
  period_compare_end?: string | null;    // YYYY-MM-DD
  diamonds_compare?: number | null;
  diamonds_compare_pct?: number | null;  // signed, kann negativ sein
  live_days_compare?: number | null;
  live_days_compare_pct?: number | null;
  live_duration_compare_sec?: number | null;
  live_duration_compare_pct?: number | null;
  streams_compare?: number | null;
  streams_compare_pct?: number | null;
  followers_compare?: number | null;
  followers_compare_pct?: number | null;
  watch_seconds_compare?: number | null;
  watch_seconds_compare_pct?: number | null;

  source_schema_version: string;
  raw_snapshot?: Record<string, unknown>;
}

export interface LivePerformanceSyncError {
  handle: string;
  period: string | null;
  reason: string;
}

export interface LivePerformanceSyncResult {
  total: number;
  inserted: number;
  updated: number;
  pool_only: number;
  skipped: number;
  frozen_skipped: number;
  errors: LivePerformanceSyncError[];
}

function currentMonthIso(): string {
  const berlinFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit",
  });
  return `${berlinFmt.format(new Date())}-01`;
}

const MONTH_RE = /^\d{4}-\d{2}-01$/;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}$/;
const EXCLUDED_HANDLES = new Set<string>(["ray_star_agency"]);

function srClient() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function syncBackstageLivePerformance(
  rows: LivePerformanceRow[],
  opts?: { force?: boolean },
): Promise<LivePerformanceSyncResult> {
  const sb = srClient();
  const force = !!opts?.force;
  const currentMonth = currentMonthIso();
  const result: LivePerformanceSyncResult = {
    total: rows.length,
    inserted: 0,
    updated: 0,
    pool_only: 0,
    skipped: 0,
    frozen_skipped: 0,
    errors: [],
  };

  const { error: pfErr } = await sb
    .from("creator_live_performance_monthly")
    .select("tiktok_handle_normalized")
    .limit(0);
  if (pfErr) {
    throw new Error(
      `preflight failed: creator_live_performance_monthly missing? (${pfErr.message})`,
    );
  }

  for (const row of rows) {
    const rawHandle = row?.tiktok_username ?? "";
    const period = row?.period_month ?? null;

    if (!rawHandle || !period) {
      result.errors.push({ handle: rawHandle, period, reason: "missing tiktok_username or period_month" });
      result.skipped++; continue;
    }
    if (!MONTH_RE.test(period)) {
      result.errors.push({ handle: rawHandle, period, reason: "period_month must be ISO YYYY-MM-01" });
      result.skipped++; continue;
    }

    const normalized = normalizeHandle(rawHandle);
    if (!normalized) {
      result.errors.push({ handle: rawHandle, period, reason: "empty handle after normalization" });
      result.skipped++; continue;
    }
    if (EXCLUDED_HANDLES.has(normalized)) {
      result.errors.push({ handle: rawHandle, period, reason: "handle excluded from sync" });
      result.skipped++; continue;
    }
    if (!row.source_schema_version) {
      result.errors.push({ handle: rawHandle, period, reason: "missing source_schema_version (R10)" });
      result.skipped++; continue;
    }

    // Date-Format-Check für Compare-Window
    if (row.period_compare_start && !DATE_RE.test(row.period_compare_start)) {
      result.errors.push({ handle: rawHandle, period, reason: "period_compare_start must be ISO YYYY-MM-DD" });
      result.skipped++; continue;
    }
    if (row.period_compare_end && !DATE_RE.test(row.period_compare_end)) {
      result.errors.push({ handle: rawHandle, period, reason: "period_compare_end must be ISO YYYY-MM-DD" });
      result.skipped++; continue;
    }

    // Profile-Lookup (Class A vs Class B)
    let resolvedProfileId: string | null = null;
    {
      const { data: profiles, error: profErr } = await sb
        .from("profiles").select("id")
        .eq("tiktok_handle_normalized", normalized);
      if (profErr) {
        result.errors.push({ handle: rawHandle, period, reason: `profile lookup: ${profErr.message}` });
        result.skipped++; continue;
      }
      if (profiles && profiles.length > 1) {
        result.errors.push({
          handle: rawHandle, period,
          reason: `ambiguous match (${profiles.length} profiles)`,
        });
        result.skipped++; continue;
      }
      if (profiles && profiles.length === 1) {
        resolvedProfileId = profiles[0].id as string;
      }
    }

    const clipFloat = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const clipInt = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Math.floor(Number(v));
      return Number.isFinite(n) ? n : null;
    };
    const clipIntNonneg = (v: unknown): number | null => {
      const n = clipInt(v);
      return n === null ? null : Math.max(0, n);
    };

    // Phantom-Skip · R5: wenn alle 4 Kern-Felder None → kein Push.
    const hasAnyKern =
      clipIntNonneg(row.current_diamonds)      !== null ||
      clipIntNonneg(row.live_valid_days)       !== null ||
      clipIntNonneg(row.live_duration_seconds) !== null ||
      clipIntNonneg(row.livestreams_count)     !== null;
    if (!hasAnyKern) {
      result.errors.push({
        handle: rawHandle, period,
        reason: "phantom_skip: all 4 kern fields null",
      });
      result.skipped++;
      continue;
    }

    // Codex-Review-Fix · HIGH: existing-Error nicht ignorieren
    // (Frozen-Historicals-Bypass-Schutz).
    const { data: existing, error: existingErr } = await sb
      .from("creator_live_performance_monthly")
      .select("id")
      .eq("tiktok_handle_normalized", normalized)
      .eq("period_month", period)
      .maybeSingle();
    if (existingErr) {
      result.errors.push({
        handle: rawHandle, period,
        reason: `existing-row lookup failed: ${existingErr.message}`,
      });
      result.skipped++;
      continue;
    }

    // Freeze · R4: vergangene Monate nicht überschreiben ohne force.
    if (existing && !force && period < currentMonth) {
      result.frozen_skipped++;
      continue;
    }

    const { error: upsertErr } = await sb
      .from("creator_live_performance_monthly")
      .upsert(
        {
          profile_id: resolvedProfileId,
          tiktok_username: rawHandle,
          tiktok_handle_normalized: normalized,
          period_month: period,

          current_diamonds:      clipIntNonneg(row.current_diamonds),
          live_valid_days:       clipIntNonneg(row.live_valid_days),
          live_duration_seconds: clipIntNonneg(row.live_duration_seconds),
          livestreams_count:     clipIntNonneg(row.livestreams_count),
          new_followers:         clipIntNonneg(row.new_followers),
          avg_watch_seconds:     clipIntNonneg(row.avg_watch_seconds),

          period_compare_start:      row.period_compare_start ?? null,
          period_compare_end:        row.period_compare_end ?? null,
          diamonds_compare:          clipIntNonneg(row.diamonds_compare),
          diamonds_compare_pct:      clipFloat(row.diamonds_compare_pct),
          live_days_compare:         clipIntNonneg(row.live_days_compare),
          live_days_compare_pct:     clipFloat(row.live_days_compare_pct),
          live_duration_compare_sec: clipIntNonneg(row.live_duration_compare_sec),
          live_duration_compare_pct: clipFloat(row.live_duration_compare_pct),
          streams_compare:           clipIntNonneg(row.streams_compare),
          streams_compare_pct:       clipFloat(row.streams_compare_pct),
          followers_compare:         clipIntNonneg(row.followers_compare),
          followers_compare_pct:     clipFloat(row.followers_compare_pct),
          watch_seconds_compare:     clipIntNonneg(row.watch_seconds_compare),
          watch_seconds_compare_pct: clipFloat(row.watch_seconds_compare_pct),

          source:                "backstage_live_leistung",
          source_schema_version: row.source_schema_version,
          synced_at:             new Date().toISOString(),
          raw_snapshot:          row.raw_snapshot ?? null,
        },
        { onConflict: "tiktok_handle_normalized,period_month" },
      );

    if (upsertErr) {
      result.errors.push({ handle: rawHandle, period, reason: `upsert failed: ${upsertErr.message}` });
      result.skipped++;
      continue;
    }
    if (existing) result.updated++;
    else result.inserted++;
    if (resolvedProfileId === null) result.pool_only++;
  }

  await writeAudit({
    actorId: null,
    actorRole: "system",
    action: "live_performance.sync.run",
    targetTable: "creator_live_performance_monthly",
    targetId: null,
    payload: {
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      pool_only: result.pool_only,
      skipped: result.skipped,
      frozen_skipped: result.frozen_skipped,
      force: !!opts?.force,
      error_count: result.errors.length,
      errors: result.errors.slice(0, 50),
    },
    ok: result.errors.length === 0,
    errorMsg: result.errors.length > 0 ? `${result.errors.length} rows failed` : null,
  });

  return result;
}
