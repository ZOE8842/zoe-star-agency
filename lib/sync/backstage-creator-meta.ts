// Backstage Creator-Meta Sync · Admin-only Stammdaten/Status-Schicht
// Wird vom POST /api/sync/backstage-creator-meta aufgerufen.
//
// Quelle: TikTok LIVE Backstage Creator-Karte (oben auf Anchor-Detail-Page)
// Ziel:   Tabelle creator_backstage_meta (Migration 0059)
// PRIMARY KEY: tiktok_handle_normalized (UPSERT, KEIN period_month)
//
// WICHTIG · COALESCE-Defense gegen NULL-Overwrite:
//   Stamm-Felder (agent_email, management_period_*, invitation_type,
//   backstage_language, bio, is_new_creator, graduation_status_label)
//   werden NUR überschrieben wenn der neue Wert NICHT NULL ist.
//   Andernfalls bleibt der existing-Wert erhalten.
//
//   Bedingungslos überschrieben werden:
//   - tiktok_username, group_name (kann legitim "Nicht in einer Gruppe" → NULL)
//   - last_live_at_observed (zeitabhängig, immer aktuellster Wert)
//   - follower_count_snapshot, videos_count_snapshot, likes_count_snapshot
//   - source, source_schema_version, synced_at, raw_snapshot
//
// RLS: nur Admin (cbm_admin_read).
// KEIN force-Flag · KEIN Frozen-Historicals · UPSERT by Design.

import { createClient as createSrClient } from "@supabase/supabase-js";
import { writeAudit } from "@/lib/audit/log";
import { normalizeHandle } from "@/lib/sync/backstage-revenue";

export interface BackstageMetaRow {
  tiktok_username: string;

  agent_email?: string | null;
  management_period_start?: string | null;  // YYYY-MM-DD
  management_period_end?: string | null;    // YYYY-MM-DD
  group_name?: string | null;
  invitation_type?: "Regulär" | "Premium" | "Elite" | null;
  backstage_language?: string | null;
  bio?: string | null;

  is_new_creator?: boolean | null;
  graduation_status_label?: string | null;
  last_live_at_observed?: string | null;    // ISO timestamptz

  follower_count_snapshot?: number | null;
  videos_count_snapshot?: number | null;
  likes_count_snapshot?: number | null;

  source_schema_version: string;
  raw_snapshot?: Record<string, unknown>;
}

export interface BackstageMetaSyncError {
  handle: string;
  reason: string;
}

export interface BackstageMetaSyncResult {
  total: number;
  inserted: number;
  updated: number;
  pool_only: number;
  skipped: number;
  errors: BackstageMetaSyncError[];
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

export async function syncBackstageCreatorMeta(
  rows: BackstageMetaRow[],
): Promise<BackstageMetaSyncResult> {
  const sb = srClient();
  const result: BackstageMetaSyncResult = {
    total: rows.length,
    inserted: 0,
    updated: 0,
    pool_only: 0,
    skipped: 0,
    errors: [],
  };

  const { error: pfErr } = await sb
    .from("creator_backstage_meta")
    .select("tiktok_handle_normalized")
    .limit(0);
  if (pfErr) {
    throw new Error(`preflight failed: creator_backstage_meta missing? (${pfErr.message})`);
  }

  for (const row of rows) {
    const rawHandle = row?.tiktok_username ?? "";
    if (!rawHandle) {
      result.errors.push({ handle: rawHandle, reason: "missing tiktok_username" });
      result.skipped++; continue;
    }

    const normalized = normalizeHandle(rawHandle);
    if (!normalized) {
      result.errors.push({ handle: rawHandle, reason: "empty handle after normalization" });
      result.skipped++; continue;
    }
    if (EXCLUDED_HANDLES.has(normalized)) {
      result.errors.push({ handle: rawHandle, reason: "handle excluded from sync" });
      result.skipped++; continue;
    }
    if (!row.source_schema_version) {
      result.errors.push({ handle: rawHandle, reason: "missing source_schema_version (R10)" });
      result.skipped++; continue;
    }

    if (row.management_period_start && !DATE_RE.test(row.management_period_start)) {
      result.errors.push({ handle: rawHandle, reason: "management_period_start must be ISO YYYY-MM-DD" });
      result.skipped++; continue;
    }
    if (row.management_period_end && !DATE_RE.test(row.management_period_end)) {
      result.errors.push({ handle: rawHandle, reason: "management_period_end must be ISO YYYY-MM-DD" });
      result.skipped++; continue;
    }

    // Profile-Lookup
    let resolvedProfileId: string | null = null;
    {
      const { data: profiles, error: profErr } = await sb
        .from("profiles").select("id")
        .eq("tiktok_handle_normalized", normalized);
      if (profErr) {
        result.errors.push({ handle: rawHandle, reason: `profile lookup: ${profErr.message}` });
        result.skipped++; continue;
      }
      if (profiles && profiles.length > 1) {
        result.errors.push({ handle: rawHandle, reason: `ambiguous match (${profiles.length} profiles)` });
        result.skipped++; continue;
      }
      if (profiles && profiles.length === 1) {
        resolvedProfileId = profiles[0].id as string;
      }
    }

    // Existing-Row für COALESCE-Schutz lesen
    // Codex-Review-Fix · HIGH: existing-Error darf NIE ignoriert werden,
    // sonst werden bei DB-Fehler protected fields zu null aufgelöst und
    // die COALESCE-Defense komplett ausgehebelt.
    const { data: existing, error: existingErr } = await sb
      .from("creator_backstage_meta")
      .select("agent_email, management_period_start, management_period_end, invitation_type, backstage_language, bio, is_new_creator, graduation_status_label")
      .eq("tiktok_handle_normalized", normalized)
      .maybeSingle();
    if (existingErr) {
      result.errors.push({
        handle: rawHandle,
        reason: `existing-row lookup failed: ${existingErr.message}`,
      });
      result.skipped++;
      continue;
    }

    const clipIntNonneg = (v: unknown): number | null => {
      if (v === null || v === undefined || v === "") return null;
      const n = Math.floor(Number(v));
      return Number.isFinite(n) ? Math.max(0, n) : null;
    };

    // COALESCE-Defense: nur Stamm-Felder schützen, NICHT zeitabhängige.
    // Logik: wenn neu == null → existing behalten. wenn neu != null → übernehmen.
    const coal = <T>(neu: T | null | undefined, alt: T | null | undefined): T | null =>
      (neu !== null && neu !== undefined) ? neu : (alt ?? null);

    const payload = {
      profile_id: resolvedProfileId,
      tiktok_username: rawHandle,
      tiktok_handle_normalized: normalized,

      // COALESCE-geschützte Stamm-Felder
      agent_email:             coal(row.agent_email,             existing?.agent_email),
      management_period_start: coal(row.management_period_start, existing?.management_period_start),
      management_period_end:   coal(row.management_period_end,   existing?.management_period_end),
      invitation_type:         coal(row.invitation_type,         existing?.invitation_type),
      backstage_language:      coal(row.backstage_language,      existing?.backstage_language),
      bio:                     coal(row.bio,                     existing?.bio),
      is_new_creator:          coal(row.is_new_creator,          existing?.is_new_creator),
      graduation_status_label: coal(row.graduation_status_label, existing?.graduation_status_label),

      // group_name: bedingungslos (NULL = "Nicht in einer Gruppe" ist legitim)
      group_name: row.group_name ?? null,

      // Zeitabhängige Felder · immer überschreiben
      last_live_at_observed: row.last_live_at_observed ?? null,

      // Snapshot-Felder · immer überschreiben (Stand letzter Sync)
      follower_count_snapshot: clipIntNonneg(row.follower_count_snapshot),
      videos_count_snapshot:   clipIntNonneg(row.videos_count_snapshot),
      likes_count_snapshot:    clipIntNonneg(row.likes_count_snapshot),

      source:                "backstage_creator_card",
      source_schema_version: row.source_schema_version,
      synced_at:             new Date().toISOString(),
      raw_snapshot:          row.raw_snapshot ?? null,
    };

    const { error: upsertErr } = await sb
      .from("creator_backstage_meta")
      .upsert(payload, { onConflict: "tiktok_handle_normalized" });

    if (upsertErr) {
      result.errors.push({ handle: rawHandle, reason: `upsert failed: ${upsertErr.message}` });
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
    action: "creator_meta.sync.run",
    targetTable: "creator_backstage_meta",
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
