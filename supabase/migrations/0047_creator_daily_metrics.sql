-- ZOE Star Agency · Migration 0047 · creator_daily_metrics
--
-- Phase 5 · Tagesranking (V9)
-- Speichert pro Creator + Tag eine Zeile mit den echten Backstage-Tageswerten.
-- Wird vom backstage-Scraper aus parse_daily_table befuellt.
-- Quelle: Backstage Anchor-Detail-Page, Daily-Table (unten).
--
-- Design analog zu creator_monthly_metrics (Migration 0046, handle-keyed):
--   profile_id NULLABLE, Match via tiktok_handle_normalized
--   Trigger cdm_auto_link_profile (BEFORE INSERT/UPDATE) → handle → profile_id
--   Trigger profiles_link_existing_cdm (AFTER profile-Mutation) → rueckwirkende Zuordnung
--   Unique: (tiktok_handle_normalized, metric_date)

create table if not exists public.creator_daily_metrics (
  id                          uuid primary key default gen_random_uuid(),
  profile_id                  uuid references public.profiles(id) on delete cascade,
  tiktok_username             text not null,
  tiktok_handle_normalized    text not null,
  metric_date                 date not null,
  diamonds                    bigint default 0,
  live_minutes                integer default 0,
  viewers                     integer default 0,
  impressions                 bigint,
  live_views                  bigint,
  ctr                         numeric,
  watchtime_avg_seconds       integer,
  new_followers               integer,
  gifts                       integer,
  gifters                     integer,
  gift_rate                   numeric,
  source                      text not null default 'backstage',
  synced_at                   timestamptz not null default now(),
  raw_snapshot                jsonb,
  constraint cdm_handle_date_uniq unique (tiktok_handle_normalized, metric_date)
);

create index if not exists cdm_profile_date_idx
  on public.creator_daily_metrics (profile_id, metric_date)
  where profile_id is not null;

create index if not exists cdm_date_diamonds_idx
  on public.creator_daily_metrics (metric_date, diamonds desc);

create or replace function public.cdm_auto_link_profile()
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

revoke execute on function public.cdm_auto_link_profile() from public, anon;

drop trigger if exists cdm_auto_link_profile_trg on public.creator_daily_metrics;
create trigger cdm_auto_link_profile_trg
  before insert or update on public.creator_daily_metrics
  for each row execute function public.cdm_auto_link_profile();

create or replace function public.profiles_link_existing_cdm()
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
    update public.creator_daily_metrics
       set profile_id = new.id
     where tiktok_handle_normalized = new.tiktok_handle_normalized
       and (profile_id is null or profile_id <> new.id);
  end if;
  return new;
end;
$$;

revoke execute on function public.profiles_link_existing_cdm() from public, anon;

drop trigger if exists profiles_link_existing_cdm_trg on public.profiles;
create trigger profiles_link_existing_cdm_trg
  after insert or update on public.profiles
  for each row execute function public.profiles_link_existing_cdm();

alter table public.creator_daily_metrics enable row level security;

create policy cdm_admin_read on public.creator_daily_metrics
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'::user_role
    )
  );

create policy cdm_manager_read on public.creator_daily_metrics
  for select using (
    exists (
      select 1 from public.profiles me
      where me.id = auth.uid() and me.role = 'manager'::user_role
        and exists (
          select 1 from public.profiles target
          where target.id = creator_daily_metrics.profile_id
            and target.manager_id = me.id
        )
    )
  );

create policy cdm_own_read on public.creator_daily_metrics
  for select using (profile_id = auth.uid());

notify pgrst, 'reload schema';
