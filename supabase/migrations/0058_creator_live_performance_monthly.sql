-- Migration 0058 · creator_live_performance_monthly
--
-- Phase C₂ (minimal) gemäß 03_Umsatz_Reiter/00_Workflow.md §6.4.
-- Rolling-Window-Speicherung der LIVE-Kernsignale pro Creator pro Monat
-- (Backstage zeigt nur ~3M, deshalb pro Monat eine Zeile).
-- Handle-keyed analog cmm (0046) und cdm (0047) und crm (0048).
--
-- WICHTIG · R17 (System-Trennung):
--   Diese Tabelle ist die Incentive-Kontext-Schicht für den Umsatz-Reiter,
--   NICHT der Beginn eines LIVE-Analytics-Systems. Sie speichert nur die
--   LIVE-Kernsignale, die TikTok-Incentive-Berechnungen direkt beeinflussen
--   (Activity-Level, Tier-Eligibility, Graduation, Bonusverhältnis).
--   Spätere LIVE-Analyse bekommt eigene `creator_live_analytics_*` Tabellen.
--
-- RLS: NUR Admin (clpm_admin_read). KEIN Manager, KEIN Creator-Self-Read.
--
-- Source: Backstage-Tab "LIVE-Leistung" (Zeitraum "Diesen Monat", UTC+0).
-- Compare-Window: TikTok-eigener Same-Range-Vergleich (NICHT voller Vormonat).

create table if not exists public.creator_live_performance_monthly (
  id                          uuid primary key default gen_random_uuid(),
  profile_id                  uuid references public.profiles(id) on delete cascade,
  tiktok_username             text not null,
  tiktok_handle_normalized    text not null,
  period_month                date not null,

  -- Kern-Performance (alle nullable · R2 Unknown ≠ 0)
  current_diamonds            bigint,
  live_valid_days             smallint,
  live_duration_seconds       bigint,
  livestreams_count           smallint,
  new_followers               int,
  avg_watch_seconds           int,

  -- TikTok-eigener Compare-Window (R7 Rolling Comparison)
  -- WICHTIG: NICHT voller Vormonat, sondern selbe Anzahl Tage rückwärts.
  period_compare_start        date,
  period_compare_end          date,
  diamonds_compare            bigint,
  diamonds_compare_pct        numeric(7,2),
  live_days_compare           smallint,
  live_days_compare_pct       numeric(7,2),
  live_duration_compare_sec   bigint,
  live_duration_compare_pct   numeric(7,2),
  streams_compare             smallint,
  streams_compare_pct         numeric(7,2),
  followers_compare           int,
  followers_compare_pct       numeric(7,2),
  watch_seconds_compare       int,
  watch_seconds_compare_pct   numeric(7,2),

  source                      text not null default 'backstage_live_leistung',
  source_schema_version       text not null,
  synced_at                   timestamptz not null default now(),
  raw_snapshot                jsonb,

  constraint clpm_handle_period_uniq unique (tiktok_handle_normalized, period_month)
);

-- Defensive CHECKs (R2 + Master-Prompt-Plausibilität)
alter table public.creator_live_performance_monthly
  drop constraint if exists clpm_nonneg_kern,
  add  constraint           clpm_nonneg_kern
       check (
         (current_diamonds      is null or current_diamonds      >= 0)
         and (live_valid_days   is null or live_valid_days       >= 0)
         and (live_duration_seconds is null or live_duration_seconds >= 0)
         and (livestreams_count is null or livestreams_count     >= 0)
         and (new_followers     is null or new_followers         >= 0)
         and (avg_watch_seconds is null or avg_watch_seconds     >= 0)
       );

alter table public.creator_live_performance_monthly
  drop constraint if exists clpm_live_days_range,
  add  constraint           clpm_live_days_range
       check (live_valid_days is null or live_valid_days <= 31);

alter table public.creator_live_performance_monthly
  drop constraint if exists clpm_compare_window,
  add  constraint           clpm_compare_window
       check (
         period_compare_start is null
         or period_compare_end is null
         or period_compare_start <= period_compare_end
       );

-- Indizes
create index if not exists clpm_profile_period_idx
  on public.creator_live_performance_monthly (profile_id, period_month)
  where profile_id is not null;

create index if not exists clpm_period_diamonds_idx
  on public.creator_live_performance_monthly (period_month, current_diamonds desc)
  where current_diamonds is not null;

create index if not exists clpm_period_live_days_idx
  on public.creator_live_performance_monthly (period_month, live_valid_days desc)
  where live_valid_days is not null;

-- Auto-Link-Trigger (analog crm_auto_link_profile aus Mig 0048)
create or replace function public.clpm_auto_link_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.profile_id is null and new.tiktok_handle_normalized is not null then
    select p.id into new.profile_id
      from public.profiles p
     where p.tiktok_handle_normalized = new.tiktok_handle_normalized
     limit 1;
  end if;
  return new;
end;
$$;
revoke execute on function public.clpm_auto_link_profile() from public, anon;

drop trigger if exists clpm_auto_link_profile_trg on public.creator_live_performance_monthly;
create trigger clpm_auto_link_profile_trg
  before insert or update on public.creator_live_performance_monthly
  for each row execute function public.clpm_auto_link_profile();

-- Profiles-Backreferenz-Trigger (analog profiles_link_existing_crm aus Mig 0048)
create or replace function public.profiles_link_existing_clpm()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.tiktok_handle_normalized is not null
     and (
       tg_op = 'INSERT'
       or old.tiktok_handle_normalized is null
       or old.tiktok_handle_normalized <> new.tiktok_handle_normalized
     )
  then
    update public.creator_live_performance_monthly
       set profile_id = new.id
     where tiktok_handle_normalized = new.tiktok_handle_normalized
       and (profile_id is null or profile_id <> new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.profiles_link_existing_clpm() from public, anon;

drop trigger if exists profiles_link_existing_clpm_trg on public.profiles;
create trigger profiles_link_existing_clpm_trg
  after insert or update on public.profiles
  for each row execute function public.profiles_link_existing_clpm();

-- RLS
alter table public.creator_live_performance_monthly enable row level security;

drop policy if exists clpm_admin_read on public.creator_live_performance_monthly;
create policy clpm_admin_read on public.creator_live_performance_monthly
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'::user_role
    )
  );

notify pgrst, 'reload schema';
