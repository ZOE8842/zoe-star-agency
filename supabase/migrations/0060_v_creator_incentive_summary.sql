-- Migration 0060 · v_creator_incentive_summary
--
-- Phase B1 (Spec §7.1) gemäß 03_Umsatz_Reiter/00_Workflow.md.
-- Erste Phase-B-Sub-Block: Read-only View die pro Creator pro Monat
-- die 3 Tabellen JOIN't (revenue + live_performance + meta).
--
-- Reversibel via DROP VIEW IF EXISTS public.v_creator_incentive_summary CASCADE.
-- RLS erbt sich aus den Basis-Tabellen (alle 3 sind admin-only).
--
-- Output-Spaltenpräfixe für klare Lesbarkeit:
--   ist_*   · TikTok-Source-of-Truth direkt aus DOM (R1)
--   live_*  · LIVE-Kernsignale für Incentive-Kontext (R17)
--   meta_*  · Stammdaten/Status (R14 raw übernommen)
--   drift_pct · derived Sanity-Check (kein UI-Block)
--   data_completeness · Badge-Hint für UI-Phase
--
-- Phase B2 wird auf dieser View aufbauen (compute IST/REAL/MAX/HIST/TREND).

create or replace view public.v_creator_incentive_summary as
select
  crm.tiktok_handle_normalized,
  crm.tiktok_username,
  crm.period_month,
  crm.profile_id,

  -- IST (Source-of-Truth aus TikTok-DOM)
  crm.estimated_bonus_usd                                 as ist_estimated_bonus_usd,
  crm.activity_revenue_usd                                as ist_activity_usd,
  crm.tier_revenue_usd                                    as ist_tier_usd,
  crm.incremental_revenue_usd                             as ist_incremental_usd,
  crm.tier_current_level                                  as ist_tier_level,
  crm.activity_current_level                              as ist_activity_level,
  crm.activity_bonus_ratio                                as ist_activity_ratio,
  crm.tier_status                                         as ist_tier_status,
  crm.activity_status                                     as ist_activity_status,
  crm.incremental_status                                  as ist_incremental_status,
  crm.tier_progress_diamonds                              as ist_tier_progress,
  crm.tier_target_diamonds                                as ist_tier_target,
  crm.missing_diamonds                                    as ist_tier_missing,
  crm.eligible_incentives_count                           as ist_eligible_incentives_count,
  crm.forecast_revenue_usd                                as ist_forecast_revenue_usd,
  crm.forecast_diamonds                                   as ist_forecast_diamonds,
  crm.last_period_total_usd                               as ist_last_period_total_usd,
  crm.match_diamonds                                      as ist_match_diamonds,
  crm.total_revenue_usd                                   as ist_total_revenue_usd_zoe_sum,

  -- LIVE-Kernsignale (Incentive-Kontext, R17)
  clpm.current_diamonds                                   as live_current_diamonds,
  clpm.live_valid_days                                    as live_valid_days,
  clpm.live_duration_seconds                              as live_duration_seconds,
  clpm.livestreams_count                                  as live_streams_count,
  clpm.new_followers                                      as live_new_followers,
  clpm.avg_watch_seconds                                  as live_avg_watch,
  clpm.period_compare_start                               as live_compare_start,
  clpm.period_compare_end                                 as live_compare_end,
  clpm.diamonds_compare                                   as live_diamonds_compare,
  clpm.live_days_compare                                  as live_days_compare,
  clpm.live_duration_compare_sec                          as live_duration_compare_sec,
  clpm.streams_compare                                    as live_streams_compare,
  clpm.followers_compare                                  as live_followers_compare,

  -- META-Stamm (R14 raw übernommen)
  cbm.invitation_type                                     as meta_invitation_type,
  cbm.is_new_creator                                      as meta_is_new_creator,
  cbm.graduation_status_label                             as meta_graduation_label,
  cbm.management_period_start                             as meta_mgmt_start,
  cbm.management_period_end                               as meta_mgmt_end,
  cbm.last_live_at_observed                               as meta_last_live_at,
  cbm.follower_count_snapshot                             as meta_followers,
  cbm.videos_count_snapshot                               as meta_videos,
  cbm.likes_count_snapshot                                as meta_likes,
  cbm.backstage_language                                  as meta_language,
  cbm.bio                                                 as meta_bio,
  cbm.group_name                                          as meta_group_name,
  cbm.agent_email                                         as meta_agent_email,

  -- Drift-Indicator · Sanity-Check zwischen TikTok-Estimated und ZOE-Summe
  -- (kein UI-Block, nur Debug · Sentry handelt > 5 % bereits in Push-API)
  case
    when crm.estimated_bonus_usd is null then null
    when crm.estimated_bonus_usd = 0 then null
    else abs(
      crm.estimated_bonus_usd -
      coalesce(crm.activity_revenue_usd, 0)
      - coalesce(crm.tier_revenue_usd, 0)
      - coalesce(crm.incremental_revenue_usd, 0)
    ) / crm.estimated_bonus_usd * 100.0
  end                                                     as drift_pct,

  -- Daten-Vollständigkeit · UI-Badge-Hint
  -- sot_live       · neue C₁-Spalten gefüllt (Mai 2026+)
  -- legacy_only    · nur alte Spalten (Pre-C₁)
  -- pre_maerz_only · Legacy-Bonusprogramm (Mig 0049)
  -- empty          · keine Daten
  case
    when crm.estimated_bonus_usd is not null then 'sot_live'
    when crm.total_revenue_usd is not null then 'legacy_only'
    when crm.legacy_revenue_usd is not null then 'pre_maerz_only'
    else 'empty'
  end                                                     as data_completeness,

  -- Sync-Timestamps für Aktualitätsbeurteilung
  crm.synced_at                                           as revenue_synced_at,
  clpm.synced_at                                          as live_synced_at,
  cbm.synced_at                                           as meta_synced_at,

  -- Schema-Version-Tracking
  crm.source_schema_version                               as revenue_schema_ver,
  clpm.source_schema_version                              as live_schema_ver,
  cbm.source_schema_version                               as meta_schema_ver

from public.creator_revenue_metrics crm
left join public.creator_live_performance_monthly clpm
  on  clpm.tiktok_handle_normalized = crm.tiktok_handle_normalized
  and clpm.period_month             = crm.period_month
left join public.creator_backstage_meta cbm
  on  cbm.tiktok_handle_normalized = crm.tiktok_handle_normalized;

-- Hinweis: meta JOIN ist NICHT period-spezifisch (cbm hat PK auf handle).
-- Das bedeutet: jede Monatszeile pro Creator zeigt die AKTUELLEN Meta-Werte.
-- Für historische Meta-Auswertung wäre eine separate History-Tabelle nötig
-- (siehe §6.5 NICHT-in-v1.8-Liste).

notify pgrst, 'reload schema';
