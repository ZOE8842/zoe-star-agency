-- Migration 0062 · v_creator_incentive_compute · IST-Sub-Komponenten ergänzen
--
-- HOTFIX-TRACKING (auf Production bereits live, hier nur Repo-Sync).
--
-- ROOT-CAUSE:
-- UI-Commit 8b2f0a9 (UI V1.2 · Incremental-Block) erweiterte den
-- Server-Side-Select aus v_creator_incentive_compute um:
--   ist_activity_usd · ist_tier_usd · ist_incremental_usd · ist_tier_target
-- Diese 4 Felder waren in der Original-Compute-View (Migration 0061) NICHT
-- enthalten. Supabase REST-API rejected die SELECT-Query → data = null
-- → compute = [] → sotLive = [] → Empty-State auf der Übersicht
-- ("Keine sot_live-Daten — wartet auf Workstation-Scraper").
--
-- Die Daten in den Basis-Tabellen waren die ganze Zeit korrekt
-- (creator_revenue_metrics hat 53 sot_live-Rows für Mai 2026).
--
-- FIX:
-- DROP + CREATE der View (CREATE OR REPLACE schlug fehl wegen
-- Spalten-Reihenfolge-Konflikt: bestehende Spalten dürfen bei REPLACE
-- nicht umsortiert werden, neue Spalten müssen am Ende stehen).
--
-- Keine Dependencies auf die View → CASCADE-frei, kein Daten-Verlust.
-- Reversibel: drop view + Migration 0061 erneut applien.

drop view if exists public.v_creator_incentive_compute;

create view public.v_creator_incentive_compute as
with month_progress as (
  select
    date_trunc('month', (now() at time zone 'Europe/Berlin'))::date            as month_start,
    (date_trunc('month', (now() at time zone 'Europe/Berlin'))
     + interval '1 month - 1 day')::date                                       as month_end,
    extract(day from (now() at time zone 'Europe/Berlin'))::int                as month_day,
    extract(day from (date_trunc('month', (now() at time zone 'Europe/Berlin'))
                      + interval '1 month - 1 day'))::int                      as month_days_total
)
select
  s.tiktok_handle_normalized,
  s.tiktok_username,
  s.period_month,
  s.profile_id,

  -- IST · 1:1 aus B1-Summary-View · jetzt vollständig inkl. Sub-Komponenten
  s.ist_estimated_bonus_usd,
  s.ist_activity_usd,                  -- NEU in 0062
  s.ist_tier_usd,                      -- NEU in 0062
  s.ist_incremental_usd,               -- NEU in 0062
  s.ist_tier_level,
  s.ist_activity_level,
  s.ist_activity_ratio,
  s.ist_tier_status,
  s.ist_activity_status,
  s.ist_incremental_status,
  s.ist_eligible_incentives_count,
  s.ist_total_revenue_usd_zoe_sum,
  s.ist_tier_target,                   -- NEU in 0062
  s.live_current_diamonds,
  s.live_valid_days,
  s.live_duration_seconds,
  s.live_streams_count,
  s.live_new_followers,
  s.data_completeness,
  s.drift_pct,
  s.meta_invitation_type,
  s.meta_is_new_creator,

  mp.month_day                                                                  as month_day,
  mp.month_days_total                                                           as month_days_total,
  greatest(0, mp.month_days_total - mp.month_day)                               as month_days_remaining,

  case
    when s.live_current_diamonds is null then null
    when mp.month_day = 0 then null
    else round((s.live_current_diamonds::numeric / mp.month_day) * mp.month_days_total)
  end                                                                           as real_projected_diamonds_eom,

  case
    when s.ist_estimated_bonus_usd is null then null
    when mp.month_day = 0 then null
    else round(
      s.ist_estimated_bonus_usd * (mp.month_days_total::numeric / mp.month_day),
      2
    )
  end                                                                           as real_projected_bonus_usd_eom,

  case
    when s.ist_tier_target is null or s.live_current_diamonds is null then null
    else greatest(0, s.ist_tier_target - s.live_current_diamonds)
  end                                                                           as max_diamonds_to_next_tier,

  case
    when s.ist_activity_level is null then null
    when s.ist_activity_level = 1 then greatest(0, 11 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level = 2 then greatest(0, 15 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level = 3 then greatest(0, 18 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level = 4 then greatest(0, 22 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level >= 5 then 0
    else null
  end                                                                           as days_to_next_activity_level,

  case
    when s.live_valid_days is null then null
    else greatest(0, 22 - s.live_valid_days)
  end                                                                           as days_to_max_activity_level,

  hist.hist_3m_avg_total,
  hist.hist_3m_count,
  hist.hist_3m_max,

  -- TREND-Klasse vergleicht REAL_EOM (Pace-Projektion zum Monatsende) vs HIST_3M_AVG
  -- für fairen eom-vs-eom-Vergleich.
  case
    when hist.hist_3m_count is null or hist.hist_3m_count < 2 then 'new_creator'
    when hist.hist_3m_avg_total is null or hist.hist_3m_avg_total = 0 then 'unknown'
    when mp.month_day = 0 then 'unknown'
    when (s.ist_estimated_bonus_usd * (mp.month_days_total::numeric / mp.month_day))
         >= hist.hist_3m_avg_total * 1.15 then 'wachsend'
    when (s.ist_estimated_bonus_usd * (mp.month_days_total::numeric / mp.month_day))
         <= hist.hist_3m_avg_total * 0.85 then 'fallend'
    when s.ist_estimated_bonus_usd is null then 'unknown'
    else 'stabil'
  end                                                                           as trend_class,

  case
    when hist.hist_3m_avg_diamonds is null or hist.hist_3m_avg_diamonds = 0 then null
    when s.live_current_diamonds is null then null
    else round(
      (s.live_current_diamonds::numeric / hist.hist_3m_avg_diamonds * 100.0),
      1
    )
  end                                                                           as diamonds_vs_hist_pct,

  s.revenue_synced_at,
  s.live_synced_at,
  s.meta_synced_at

from public.v_creator_incentive_summary s
cross join month_progress mp
left join lateral (
  select
    avg(coalesce(estimated_bonus_usd, total_revenue_usd))            as hist_3m_avg_total,
    max(coalesce(estimated_bonus_usd, total_revenue_usd))            as hist_3m_max,
    avg(forecast_diamonds)::bigint                                   as hist_3m_avg_diamonds,
    count(*)                                                         as hist_3m_count
  from public.creator_revenue_metrics h
  where h.tiktok_handle_normalized = s.tiktok_handle_normalized
    and h.period_month < s.period_month
    and h.period_month >= s.period_month - interval '3 months'
    and (h.total_revenue_usd is not null or h.estimated_bonus_usd is not null)
) hist on true;

notify pgrst, 'reload schema';
