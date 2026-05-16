// Backstage Revenue-Sync · Admin-only Umsatz-Modul (Phase 1)
// Wird vom POST /api/sync/backstage-revenue aufgerufen.
//
// Quelle: TikTok LIVE Backstage Anreize-Pages (Activity · Tier · Incremental)
// Ziel:   Tabelle creator_revenue_metrics (Migration 0048, handle-keyed)
// Idempotenz: ON CONFLICT (tiktok_handle_normalized, period_month) DO UPDATE.
//
// RLS: nur Admin (crm_admin_read). Manager + Creator sehen nichts.

import { createClient as createSrClient } from "@supabase/supabase-js";
import { writeAudit } from "@/lib/audit/log";

export interface RevenueRow {
  tiktok_username: string;
  period_month: string;                  // YYYY-MM-01

  // Current (Tab 1)
  activity_revenue_usd?: number | null;
  tier_revenue_usd?: number | null;
  incremental_revenue_usd?: number | null;
  total_revenue_usd?: number | null;     // optional · wird ggf. server berechnet
  last_period_total_usd?: number | null;

  // Forecast (Tab 2)
  forecast_revenue_usd?: number | null;
  forecast_diamonds?: number | null;
  forecast_bonus_usd?: number | null;

  // Missing (Tab 3)
  missing_revenue_usd?: number | null;
  missing_diamonds?: number | null;
  missing_next_tier_label?: string | null;
  missing_status?: "near" | "critical" | "reached" | "none" | null;

  raw_snapshot?: Record<string, unknown>;
}

export interface RevenueSyncError {
  handle: string;
  period: string | null;
  reason: string;
}

export interface RevenueSyncResult {
  total: number;
  inserted: number;
  updated: number;
  pool_only: number;
  skipped: number;
  frozen_skipped: number;   // vergangene Monate, die nicht ueberschrieben wurden
  errors: RevenueSyncError[];
}

// Aktueller Monat in Europe/Berlin ISO (Codex-MEDIUM-Fix: stabile TZ).
// Verhindert dass an Tagesgrenzen Server-UTC vs Workstation-Berlin
// unterschiedliche current-month-Bestimmung haben.
function currentMonthIso(): string {
  const berlinFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit",
  });
  // en-CA gibt "YYYY-MM" zurueck
  return `${berlinFmt.format(new Date())}-01`;
}

const MONTH_RE = /^\d{4}-\d{2}-01$/;
const EXCLUDED_HANDLES = new Set<string>(["ray_star_agency"]);

function srClient() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export function normalizeHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, "").toLowerCase().replace(/^@/, "");
}

export async function syncBackstageRevenue(
  rows: RevenueRow[],
  opts?: { force?: boolean },
): Promise<RevenueSyncResult> {
  const sb = srClient();
  const force = !!opts?.force;
  const currentMonth = currentMonthIso();
  const result: RevenueSyncResult = {
    total: rows.length,
    inserted: 0,
    updated: 0,
    pool_only: 0,
    skipped: 0,
    frozen_skipped: 0,
    errors: [],
  };

  const { error: pfErr } = await sb
    .from("creator_revenue_metrics")
    .select("tiktok_handle_normalized")
    .limit(0);
  if (pfErr) {
    throw new Error(`preflight failed: creator_revenue_metrics missing? (${pfErr.message})`);
  }

  for (const row of rows) {
    const rawHandle = row?.tiktok_username ?? "";
    const period = row?.period_month ?? null;

    if (!rawHandle || !period) {
      result.errors.push({ handle: rawHandle, period, reason: "missing tiktok_username or period_month" });
      result.skipped++;
      continue;
    }
    if (!MONTH_RE.test(period)) {
      result.errors.push({ handle: rawHandle, period, reason: "period_month must be ISO YYYY-MM-01" });
      result.skipped++;
      continue;
    }

    const normalized = normalizeHandle(rawHandle);
    if (!normalized) {
      result.errors.push({ handle: rawHandle, period, reason: "empty handle after normalization" });
      result.skipped++;
      continue;
    }
    if (EXCLUDED_HANDLES.has(normalized)) {
      result.errors.push({ handle: rawHandle, period, reason: "handle excluded from sync" });
      result.skipped++;
      continue;
    }

    // Profile-Lookup (optional · Class A vs Class B)
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
      return Number.isFinite(n) ? Math.max(0, n) : null;
    };

    // total_revenue_usd auto-berechnen NUR wenn mind. eine Komponente nicht-null ist.
    // Codex-CRITICAL-Fix: null ?? 0 wuerde fehlgeschlagenen Scrape als verifiziertes 0 speichern.
    const a = clipFloat(row.activity_revenue_usd);
    const t = clipFloat(row.tier_revenue_usd);
    const i = clipFloat(row.incremental_revenue_usd);
    const totalProvided = clipFloat(row.total_revenue_usd);
    const hasAnyComponent = a !== null || t !== null || i !== null;
    const total = totalProvided !== null
      ? totalProvided
      : hasAnyComponent
        ? (a ?? 0) + (t ?? 0) + (i ?? 0)
        : null;

    // Codex-CRITICAL-Fix + MEDIUM-Skip: Phantom-Skip
    // Wenn ALLE Pflichtfelder null → kein Push (Daten-Layer-Failure, kein verifiziertes Null-Umsatz)
    const hasAnyMeaningfulField =
      hasAnyComponent ||
      totalProvided !== null ||
      clipFloat(row.forecast_revenue_usd) !== null ||
      clipFloat(row.forecast_bonus_usd) !== null ||
      clipInt(row.forecast_diamonds) !== null ||
      clipFloat(row.last_period_total_usd) !== null;
    if (!hasAnyMeaningfulField) {
      result.errors.push({
        handle: rawHandle, period,
        reason: "phantom_skip: all parsed fields null",
      });
      result.skipped++;
      continue;
    }

    const { data: existing } = await sb
      .from("creator_revenue_metrics")
      .select("id")
      .eq("tiktok_handle_normalized", normalized)
      .eq("period_month", period)
      .maybeSingle();

    // FREEZE-Regel: vergangene Monate werden NUR EINMAL gespeichert.
    // Wenn period < currentMonth UND row existiert → skip (kein Overwrite).
    // Ausnahme: opts.force === true (manueller Rebuild).
    if (existing && !force && period < currentMonth) {
      result.frozen_skipped++;
      continue;
    }

    const { error: upsertErr } = await sb
      .from("creator_revenue_metrics")
      .upsert(
        {
          profile_id: resolvedProfileId,
          tiktok_username: rawHandle,
          tiktok_handle_normalized: normalized,
          period_month: period,
          activity_revenue_usd:    clipFloat(row.activity_revenue_usd),
          tier_revenue_usd:        clipFloat(row.tier_revenue_usd),
          incremental_revenue_usd: clipFloat(row.incremental_revenue_usd),
          total_revenue_usd:       total,
          last_period_total_usd:   clipFloat(row.last_period_total_usd),
          forecast_revenue_usd:    clipFloat(row.forecast_revenue_usd),
          forecast_diamonds:       clipInt(row.forecast_diamonds),
          forecast_bonus_usd:      clipFloat(row.forecast_bonus_usd),
          missing_revenue_usd:     clipFloat(row.missing_revenue_usd),
          missing_diamonds:        clipInt(row.missing_diamonds),
          missing_next_tier_label: row.missing_next_tier_label ?? null,
          missing_status:          row.missing_status ?? null,
          source:                  "backstage",
          synced_at:               new Date().toISOString(),
          raw_snapshot:            row.raw_snapshot ?? null,
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
    action: "revenue.sync.run",
    targetTable: "creator_revenue_metrics",
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
