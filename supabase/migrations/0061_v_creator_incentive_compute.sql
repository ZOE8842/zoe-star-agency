-- Migration 0061 · v_creator_incentive_compute
--
-- Phase B2 · Compute-Schicht über v_creator_incentive_summary.
-- Liefert deterministische Berechnungen für IST/REAL/MAX/HIST/TREND.
-- KEIN ML, KEIN Scoring-Monster, KEIN versteckter State —
-- jede Spalte ist eine einfache SQL-Expression.
--
-- WICHTIGE EINORDNUNG (R13):
-- Master-Prompt-Tabellen (Activity-Level-Tage-Schwellen) sind NUR Annäherung.
-- TikTok-DOM ist Source of Truth. Wir nutzen die Tabelle hier als Approximation
-- für `days_to_next_activity_level`, weil wir activity_progress/target aktuell
-- nicht persistieren. Wenn TikTok seine Schwellen ändert, müsste diese View
-- aktualisiert werden.
--
-- Reversibel: drop view if exists public.v_creator_incentive_compute cascade;

create or replace view public.v_creator_incentive_compute as
with month_progress as (
  -- Tage im aktuellen Monat in Europe/Berlin
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

  -- ============== IST · 1:1 aus B1-View ==============
  s.ist_estimated_bonus_usd,
  s.ist_tier_level,
  s.ist_activity_level,
  s.ist_activity_ratio,
  s.ist_tier_status,
  s.ist_activity_status,
  s.ist_incremental_status,
  s.ist_eligible_incentives_count,
  s.live_current_diamonds,
  s.live_valid_days,
  s.live_duration_seconds,
  s.live_streams_count,
  s.live_new_followers,
  s.data_completeness,
  s.drift_pct,
  s.meta_invitation_type,
  s.meta_is_new_creator,

  -- ============== Monats-Kontext ==============
  mp.month_day                                                                  as month_day,
  mp.month_days_total                                                           as month_days_total,
  greatest(0, mp.month_days_total - mp.month_day)                               as month_days_remaining,

  -- ============== REAL · Pace-Projektion auf Monatsende ==============
  -- Linear: aktueller Diamond-Stand / Tag vergangen × Tage gesamt
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

  -- ============== MAX · Best-Case bis Monatsende ==============
  -- Diamonds-Bedarf bis Tier-Target (nur wenn Target bekannt)
  case
    when s.ist_tier_target is null or s.live_current_diamonds is null then null
    else greatest(0, s.ist_tier_target - s.live_current_diamonds)
  end                                                                           as max_diamonds_to_next_tier,

  -- LIVE-Tage-Bedarf für nächstes Activity-Level (Master-Prompt-Tabelle, R13-Annäherung)
  --   Level 1 → 11 / Level 2 → 15 / Level 3 → 18 / Level 4 → 22 / Level 5 → MAX (=0)
  case
    when s.ist_activity_level is null then null
    when s.ist_activity_level = 1 then greatest(0, 11 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level = 2 then greatest(0, 15 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level = 3 then greatest(0, 18 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level = 4 then greatest(0, 22 - coalesce(s.live_valid_days, 0))
    when s.ist_activity_level >= 5 then 0
    else null
  end                                                                           as days_to_next_activity_level,

  -- LIVE-Tage-Bedarf bis Max-Level-5 (= 22 Tage)
  case
    when s.live_valid_days is null then null
    else greatest(0, 22 - s.live_valid_days)
  end                                                                           as days_to_max_activity_level,

  -- ============== HIST · 3-Monats-Rückblick ==============
  hist.hist_3m_avg_total,
  hist.hist_3m_count,
  hist.hist_3m_max,

  -- ============== TREND · deterministische Klassifikation ==============
  -- Vergleicht aktuellen estimated/total mit 3M-Avg.
  -- Schwelle: ±15 % vom 3M-Avg.
  -- DATA_LEVEL_NEW: weniger als 2 Vergleichsmonate → 'new_creator' (R9)
  case
    when hist.hist_3m_count is null or hist.hist_3m_count < 2 then 'new_creator'
    when s.ist_estimated_bonus_usd is null
         and s.ist_total_revenue_usd_zoe_sum is null then 'unknown'
    when coalesce(s.ist_estimated_bonus_usd, s.ist_total_revenue_usd_zoe_sum)
         >= hist.hist_3m_avg_total * 1.15 then 'wachsend'
    when coalesce(s.ist_estimated_bonus_usd, s.ist_total_revenue_usd_zoe_sum)
         <= hist.hist_3m_avg_total * 0.85 then 'fallend'
    else 'stabil'
  end                                                                           as trend_class,

  -- Diamonds-Pace vs. Hist-Avg (relativ)
  case
    when hist.hist_3m_avg_diamonds is null or hist.hist_3m_avg_diamonds = 0 then null
    when s.live_current_diamonds is null then null
    else round(
      (s.live_current_diamonds::numeric / hist.hist_3m_avg_diamonds * 100.0),
      1
    )
  end                                                                           as diamonds_vs_hist_pct,

  -- Sync-Aktualität
  s.revenue_synced_at,
  s.live_synced_at,
  s.meta_synced_at

from public.v_creator_incentive_summary s
cross join month_progress mp
left join lateral (
  -- 3M-Lookback OHNE den aktuellen Monat (period_month < s.period_month)
  -- forecast_diamonds als Proxy für total_diamonds (aktueller current_diamonds
  -- ist nur in clpm, das hatten alte Monate nicht)
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
