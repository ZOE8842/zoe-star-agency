// Backstage Daily-Metrics-Sync · Upsert pro Creator + Tag.
// Wird vom POST /api/sync/backstage-daily-metrics aufgerufen.
//
// Quelle: TikTok LIVE Backstage Daily-Tabelle (parse_daily_table im Scraper).
// Ziel:   Tabelle creator_daily_metrics (Migration 0047, handle-keyed).
// Idempotenz: ON CONFLICT (tiktok_handle_normalized, metric_date) DO UPDATE.
//
// Pro Creator + Tag eine Zeile mit den echten Tageswerten.
// Trigger cdm_auto_link_profile setzt profile_id automatisch wenn handle
// einen Match in profiles hat — sonst Class B (Backstage-only).

import { createClient as createSrClient } from "@supabase/supabase-js";
import { writeAudit } from "@/lib/audit/log";

export interface DailyRow {
  tiktok_username: string;           // raw
  metric_date: string;                // ISO YYYY-MM-DD
  diamonds?: number | null;
  live_minutes?: number | null;
  viewers?: number | null;
  impressions?: number | null;
  live_views?: number | null;
  ctr?: number | null;
  watchtime_avg_seconds?: number | null;
  new_followers?: number | null;
  gifts?: number | null;
  gifters?: number | null;
  gift_rate?: number | null;
  raw_snapshot?: Record<string, unknown>;
}

export interface DailySyncError {
  handle: string;
  date: string | null;
  reason: string;
}

export interface DailySyncResult {
  total: number;
  inserted: number;
  updated: number;
  pool_only: number;
  skipped: number;
  errors: DailySyncError[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
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

export async function syncBackstageDailyMetrics(
  rows: DailyRow[],
): Promise<DailySyncResult> {
  const sb = srClient();
  const result: DailySyncResult = {
    total: rows.length,
    inserted: 0,
    updated: 0,
    pool_only: 0,
    skipped: 0,
    errors: [],
  };

  // Pre-flight
  const { error: pfErr } = await sb
    .from("creator_daily_metrics")
    .select("tiktok_handle_normalized")
    .limit(0);
  if (pfErr) {
    throw new Error(
      `preflight failed: creator_daily_metrics missing? (${pfErr.message})`,
    );
  }

  for (const row of rows) {
    const rawHandle = row?.tiktok_username ?? "";
    const date = row?.metric_date ?? null;

    if (!rawHandle || !date) {
      result.errors.push({ handle: rawHandle, date, reason: "missing tiktok_username or metric_date" });
      result.skipped++;
      continue;
    }
    if (!DATE_RE.test(date)) {
      result.errors.push({ handle: rawHandle, date, reason: "metric_date must be ISO YYYY-MM-DD" });
      result.skipped++;
      continue;
    }

    const normalized = normalizeHandle(rawHandle);
    if (!normalized) {
      result.errors.push({ handle: rawHandle, date, reason: "empty handle after normalization" });
      result.skipped++;
      continue;
    }

    if (EXCLUDED_HANDLES.has(normalized)) {
      result.errors.push({ handle: rawHandle, date, reason: "handle excluded from sync" });
      result.skipped++;
      continue;
    }

    // Profile-Lookup (optional)
    let resolvedProfileId: string | null = null;
    {
      const { data: profiles, error: profErr } = await sb
        .from("profiles")
        .select("id")
        .eq("tiktok_handle_normalized", normalized);
      if (profErr) {
        result.errors.push({ handle: rawHandle, date, reason: `profile lookup failed: ${profErr.message}` });
        result.skipped++;
        continue;
      }
      if (profiles && profiles.length > 1) {
        result.errors.push({
          handle: rawHandle,
          date,
          reason: `ambiguous match (${profiles.length} profiles)`,
        });
        result.skipped++;
        continue;
      }
      if (profiles && profiles.length === 1) {
        resolvedProfileId = profiles[0].id as string;
      }
    }

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

    // Insert/Update unterscheiden
    const { data: existing } = await sb
      .from("creator_daily_metrics")
      .select("id")
      .eq("tiktok_handle_normalized", normalized)
      .eq("metric_date", date)
      .maybeSingle();

    const { error: upsertErr } = await sb
      .from("creator_daily_metrics")
      .upsert(
        {
          profile_id: resolvedProfileId,
          tiktok_username: rawHandle,
          tiktok_handle_normalized: normalized,
          metric_date: date,
          diamonds:              clipInt(row.diamonds) ?? 0,
          live_minutes:          clipInt(row.live_minutes) ?? 0,
          viewers:               clipInt(row.viewers) ?? 0,
          impressions:           clipInt(row.impressions),
          live_views:            clipInt(row.live_views),
          ctr:                   clipFloat(row.ctr),
          watchtime_avg_seconds: clipInt(row.watchtime_avg_seconds),
          new_followers:         clipInt(row.new_followers),
          gifts:                 clipInt(row.gifts),
          gifters:               clipInt(row.gifters),
          gift_rate:             clipFloat(row.gift_rate),
          raw_snapshot:          row.raw_snapshot ?? null,
          source:                "backstage",
          synced_at:             new Date().toISOString(),
        },
        { onConflict: "tiktok_handle_normalized,metric_date" },
      );

    if (upsertErr) {
      result.errors.push({ handle: rawHandle, date, reason: `upsert failed: ${upsertErr.message}` });
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
    action: "daily_metrics.sync.run",
    targetTable: "creator_daily_metrics",
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
    errorMsg: result.errors.length > 0 ? `${result.errors.length} rows failed` : null,
  });

  return result;
}
