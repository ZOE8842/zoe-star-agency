-- Migration 0057 · creator_revenue_metrics Source-of-Truth + DOM-Detail-Spalten
--
-- Phase C₁ (minimal) gemäß 03_Umsatz_Reiter/00_Workflow.md §6.2.
-- Additiv. Kein DROP, kein Backfill, kein RLS-Change, kein Trigger.
-- Alle neuen Spalten nullable (R2 · Unknown ≠ 0).
-- Frozen Historicals (R4): alte Rows behalten alle bisherigen Werte unverändert.
--
-- Hintergrund:
--   Phase A.5 (Top-15 Mai 2026) zeigte 0,00 $ Drift zwischen
--   TikTok-Estimated und ZOE-Summe (activity+tier+incremental).
--   Wir persistieren TikTok-Estimated trotzdem als Source-of-Truth-Anker,
--   damit zukünftige Drift (z.B. wenn Incremental aktiv wird) sichtbar bleibt.
--
--   Zusätzlich werden die im DOM bereits sichtbaren operativen Detail-Felder
--   persistiert (R13: TikTok-DOM > interne Formel · R14: Hinweise raw übernehmen).
--
-- Verifikations-Anker: Debleopard Mai 2026.
--   Siehe 03_Umsatz_Reiter/01_Briefing.md §7.

alter table public.creator_revenue_metrics
  add column if not exists estimated_bonus_usd       numeric(10,2),
  add column if not exists tier_current_level        smallint,
  add column if not exists tier_progress_diamonds    bigint,
  add column if not exists tier_target_diamonds      bigint,
  add column if not exists tier_status               text,
  add column if not exists activity_current_level    smallint,
  add column if not exists activity_bonus_ratio      numeric(4,3),
  add column if not exists activity_status           text,
  add column if not exists incremental_status        text,
  add column if not exists match_diamonds            bigint,
  add column if not exists eligible_incentives_count smallint,
  add column if not exists source_schema_version     text;

-- CHECK-Constraints · defensive, gemäß Master-Prompt-Schwellen
-- Aktivitäts-Level 1-5 (Master-Prompt-Tabelle Abschnitt 2.1)
-- Tier-Level 1-10 (Master-Prompt-Tabelle Abschnitt 2.2)
-- Bonusverhältnis aktuell 0,5 % - 3,5 %; Constraint mit Puffer auf 5 %
--   (lockerbar falls TikTok höhere Werte einführt)

alter table public.creator_revenue_metrics
  drop constraint if exists crm_tier_current_level_range,
  add  constraint           crm_tier_current_level_range
       check (tier_current_level is null
              or (tier_current_level between 1 and 10));

alter table public.creator_revenue_metrics
  drop constraint if exists crm_activity_current_level_range,
  add  constraint           crm_activity_current_level_range
       check (activity_current_level is null
              or (activity_current_level between 1 and 5));

alter table public.creator_revenue_metrics
  drop constraint if exists crm_activity_bonus_ratio_range,
  add  constraint           crm_activity_bonus_ratio_range
       check (activity_bonus_ratio is null
              or (activity_bonus_ratio between 0 and 0.05));

alter table public.creator_revenue_metrics
  drop constraint if exists crm_estimated_bonus_nonneg,
  add  constraint           crm_estimated_bonus_nonneg
       check (estimated_bonus_usd is null
              or estimated_bonus_usd >= 0);

alter table public.creator_revenue_metrics
  drop constraint if exists crm_diamonds_nonneg,
  add  constraint           crm_diamonds_nonneg
       check ((tier_progress_diamonds is null or tier_progress_diamonds >= 0)
              and (tier_target_diamonds is null or tier_target_diamonds >= 0)
              and (match_diamonds       is null or match_diamonds       >= 0));

alter table public.creator_revenue_metrics
  drop constraint if exists crm_eligible_incentives_range,
  add  constraint           crm_eligible_incentives_range
       check (eligible_incentives_count is null
              or (eligible_incentives_count between 0 and 20));

-- Komfort-Index für zukünftigen Drift-Check (Sentry-Side, kein UI)
create index if not exists crm_period_estimated_idx
  on public.creator_revenue_metrics (period_month, estimated_bonus_usd desc)
  where estimated_bonus_usd is not null;

-- Komfort-Index für Tier-Level-Aggregation (Phase B Vorbereitung, optional schon jetzt)
create index if not exists crm_period_tier_level_idx
  on public.creator_revenue_metrics (period_month, tier_current_level)
  where tier_current_level is not null;

-- Reload PostgREST-Schema-Cache (analog Migration 0048)
notify pgrst, 'reload schema';
