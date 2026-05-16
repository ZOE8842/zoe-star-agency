// Backstage-Metrics-Sync · Resolve + Validate + Upsert + Audit.
// Wird vom POST /api/sync/backstage-metrics aufgerufen.
//
// Quelle: TikTok LIVE Backstage (extern via Workstation-Playwright-Push).
// Ziel:   Tabelle creator_monthly_metrics (handle-keyed seit Migration 0046).
// Idempotenz: ON CONFLICT (tiktok_handle_normalized, month) DO UPDATE.
//
// V6 (2026-05-16, Migration 0046):
//   - Tabelle ist jetzt handle-keyed, profile_id NULLABLE.
//   - Push akzeptiert auch Handles ohne Portal-Profile (Class B / Backstage-Only).
//     Trigger cmm_auto_link_profile setzt profile_id automatisch, falls ein
//     Profile mit gleichem handle existiert. Sonst bleibt profile_id NULL.
//   - Wenn der Creator sich spaeter onboarded (handle in profiles gesetzt),
//     greift Trigger profiles_link_existing_cmm und uebernimmt die Historie.
//   - Ambiguous-Match (mehrere Profiles mit gleichem handle) bleibt Skip-Fall
//     (Datenintegritaets-Problem, sollte nicht passieren).

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
  // Phase-5-KPIs (Migration 0044) — alle optional, additive
  diamonds_month?: number | null;
  gift_rate?: number | null;
  impressions?: number | null;
  live_views?: number | null;
  followers_gained?: number | null;
  ctr?: number | null;
  watchtime_avg_seconds?: number | null;
  streams_count?: number | null;
  gifts_count?: number | null;
  gifters_count?: number | null;
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
  pool_only: number;   // V6: Class-B-Rows (handle-only, kein profile_id)
  skipped: number;
  errors: SyncError[];
}

const ALLOWED_STATUS = new Set(["aktiv", "unregelmaessig", "inaktiv"]);
const MONTH_RE = /^\d{4}-\d{2}-01$/;

const EXCLUDED_HANDLES = new Set<string>(["ray_star_agency"]);

function srClient() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Normalisierungs-Pipeline (deckt sich 1:1 mit profiles.tiktok_handle_normalized
// und der neuen creator_monthly_metrics.tiktok_handle_normalized):
//   1) ALLEN whitespace strippen
//   2) lower()
//   3) fuehrendes @ entfernen
export function normalizeHandle(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, "").toLowerCase().replace(/^@/, "");
}

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
    pool_only: 0,
    skipped: 0,
    errors: [],
  };

  // Pre-Flight: Migration 0046 muss applied sein (handle-Spalte auf cmm).
  const { error: preflightErr } = await sb
    .from("creator_monthly_metrics")
    .select("tiktok_handle_normalized")
    .limit(0);
  if (preflightErr) {
    throw new Error(
      `preflight failed: creator_monthly_metrics.tiktok_handle_normalized missing? (${preflightErr.message})`,
    );
  }

  for (const row of rows) {
    const rawHandle = row?.tiktok_username ?? "";
    const month = row?.month ?? null;

    // Pflichtfelder
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

    // RAY-Exclusion (hardcoded, identisch zu /api/sync/backstage-creators)
    if (EXCLUDED_HANDLES.has(normalized)) {
      result.errors.push({
        handle: rawHandle,
        month,
        reason: "handle excluded from sync (EXCLUDED_HANDLES)",
      });
      result.skipped++;
      continue;
    }

    // Profile-Lookup (optional — kein Hard-Skip mehr)
    //   - 0 Matches  → Class-B-Eintrag (profile_id bleibt NULL)
    //   - 1 Match    → Class-A-Eintrag (profile_id wird gesetzt)
    //   - >1 Matches → Skip (Datenproblem, sollte nicht passieren)
    let resolvedProfileId: string | null = null;
    {
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
      if (profiles && profiles.length > 1) {
        result.errors.push({
          handle: rawHandle,
          month,
          reason: `ambiguous match (${profiles.length} profiles): ${profiles
            .map((p) => p.id)
            .join(",")}`,
        });
        result.skipped++;
        continue;
      }
      if (profiles && profiles.length === 1) {
        resolvedProfileId = profiles[0].id as string;
      }
      // else: profiles=0 → Class B, profile_id bleibt NULL
    }

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

    // Insert vs Update unterscheiden (handle-keyed)
    const { data: existing } = await sb
      .from("creator_monthly_metrics")
      .select("id")
      .eq("tiktok_handle_normalized", normalized)
      .eq("month", month)
      .maybeSingle();

    // Phase-5-KPI defensive parsing
    const clipInt = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Math.floor(Number(v));
      return Number.isFinite(n) ? Math.max(0, n) : null;
    };
    const clipFloat = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, n) : null;
    };

    const { error: upsertErr } = await sb
      .from("creator_monthly_metrics")
      .upsert(
        {
          profile_id: resolvedProfileId,
          tiktok_username: rawHandle,
          tiktok_handle_normalized: normalized,
          month,
          valid_live_days: validLiveDays,
          live_minutes_total: liveMinutes,
          live_hours_display: liveHoursDisplay,
          average_viewers: avgViewers,
          last_live_date: row.last_live_date ?? null,
          activity_status: status,
          diamonds_month:        clipInt(row.diamonds_month) ?? 0,
          gift_rate:             clipFloat(row.gift_rate),
          impressions:           clipInt(row.impressions),
          live_views:            clipInt(row.live_views),
          followers_gained:      clipInt(row.followers_gained),
          ctr:                   clipFloat(row.ctr),
          watchtime_avg_seconds: clipInt(row.watchtime_avg_seconds),
          streams_count:         clipInt(row.streams_count),
          gifts_count:           clipInt(row.gifts_count),
          gifters_count:         clipInt(row.gifters_count),
          raw_snapshot: row.raw_snapshot ?? null,
          source: "backstage",
          synced_at: new Date().toISOString(),
          error_message: null,
        },
        { onConflict: "tiktok_handle_normalized,month" },
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
    if (resolvedProfileId === null) result.pool_only++;
  }

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
      pool_only: result.pool_only,
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
