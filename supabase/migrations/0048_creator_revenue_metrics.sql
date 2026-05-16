-- Migration 0048 · creator_revenue_metrics
-- Admin-only Umsatz-Modul (Phase 1: DB-Skelett)
-- Handle-keyed analog cmm (0046) und cdm (0047).
-- Pro Creator + Period (Monat) eine Zeile.
--
-- RLS: NUR Admin (crm_admin_read). KEIN Manager, KEIN Creator-Self-Read.
-- Umsatz-Daten sind sensitiv (interne Bonus-Werte) → admin-only by design.

create table if not exists public.creator_revenue_metrics (
  id                          uuid primary key default gen_random_uuid(),
  profile_id                  uuid references public.profiles(id) on delete cascade,
  tiktok_username             text not null,
  tiktok_handle_normalized    text not null,
  period_month                date not null,

  -- CURRENT (Tab 1)
  activity_revenue_usd        numeric(10,2),
  tier_revenue_usd            numeric(10,2),
  incremental_revenue_usd     numeric(10,2),
  total_revenue_usd           numeric(10,2),
  last_period_total_usd       numeric(10,2),

  -- FORECAST (Tab 2)
  forecast_revenue_usd        numeric(10,2),
  forecast_diamonds           bigint,
  forecast_bonus_usd          numeric(10,2),

  -- MISSING (Tab 3)
  missing_revenue_usd         numeric(10,2),
  missing_diamonds            bigint,
  missing_next_tier_label     text,
  missing_status              text check (missing_status in ('near','critical','reached','none')),

  source                      text not null default 'backstage',
  synced_at                   timestamptz not null default now(),
  raw_snapshot                jsonb,
  constraint crm_handle_period_uniq unique (tiktok_handle_normalized, period_month)
);

create index if not exists crm_profile_period_idx
  on public.creator_revenue_metrics (profile_id, period_month)
  where profile_id is not null;

create index if not exists crm_period_total_idx
  on public.creator_revenue_metrics (period_month, total_revenue_usd desc);

create or replace function public.crm_auto_link_profile()
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
revoke execute on function public.crm_auto_link_profile() from public, anon;

drop trigger if exists crm_auto_link_profile_trg on public.creator_revenue_metrics;
create trigger crm_auto_link_profile_trg
  before insert or update on public.creator_revenue_metrics
  for each row execute function public.crm_auto_link_profile();

create or replace function public.profiles_link_existing_crm()
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
    update public.creator_revenue_metrics
       set profile_id = new.id
     where tiktok_handle_normalized = new.tiktok_handle_normalized
       and (profile_id is null or profile_id <> new.id);
  end if;
  return new;
end;
$$;
revoke execute on function public.profiles_link_existing_crm() from public, anon;

drop trigger if exists profiles_link_existing_crm_trg on public.profiles;
create trigger profiles_link_existing_crm_trg
  after insert or update on public.profiles
  for each row execute function public.profiles_link_existing_crm();

alter table public.creator_revenue_metrics enable row level security;

create policy crm_admin_read on public.creator_revenue_metrics
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'::user_role
    )
  );

notify pgrst, 'reload schema';
