-- ZOE Star Agency — Block F V2-Stufe-2 · Data-Sources
-- Cache fuer TikTok-Public-Snapshots damit jeder Analyse-Run nicht
-- erneut Apify kostet. 24h-Cache pro tiktok_username.
-- Idempotent.

create table if not exists tiktok_public_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  tiktok_username text not null,
  source text not null default 'apify' check (source in ('apify','manual','stub')),
  payload jsonb not null,
  cost_usd numeric(10,4) default 0,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz,
  error_message text
);

create index if not exists tps_username_fetched_idx
  on tiktok_public_snapshots (tiktok_username, fetched_at desc);

create index if not exists tps_profile_fetched_idx
  on tiktok_public_snapshots (profile_id, fetched_at desc)
  where profile_id is not null;

alter table tiktok_public_snapshots enable row level security;

drop policy if exists tps_own on tiktok_public_snapshots;
create policy tps_own on tiktok_public_snapshots for select
  using (profile_id = auth.uid());

drop policy if exists tps_admin_all on tiktok_public_snapshots;
create policy tps_admin_all on tiktok_public_snapshots for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 2) creator_monthly_metrics: source-Spalte ggf. erweitern (Backstage-Sync)
-- (Tabelle existiert bereits aus 0008_member_onboarding.sql)
-- Falls source 'backstage' default ist, lassen wir das so.
-- Erweitern: error_message + raw_snapshot fuer Debug.

alter table creator_monthly_metrics
  add column if not exists raw_snapshot jsonb,
  add column if not exists error_message text;


-- 3) data_source_health: Operational-Tracking-Tabelle
-- Worker und Sync-Jobs loggen hier ihre Runs damit Admin sehen kann
-- wann zuletzt was geholt wurde.
create table if not exists data_source_health (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('apify_tiktok','backstage_sync','claude_worker')),
  kind text,
  ok boolean not null,
  count_items integer default 0,
  cost_usd numeric(10,4) default 0,
  duration_ms integer,
  error_message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dsh_source_created_idx
  on data_source_health (source, created_at desc);

alter table data_source_health enable row level security;

drop policy if exists dsh_admin_read on data_source_health;
create policy dsh_admin_read on data_source_health for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
