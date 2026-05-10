-- ZOE Star Agency — Member-Onboarding V3.0
-- Erweitert profiles um Onboarding-/Creator-Felder ohne private Daten,
-- legt creator_monthly_metrics + zoe_app_connection_codes an.
-- Idempotent. Run via Supabase Dashboard SQL Editor oder
-- via service-role REST.
--
-- WICHTIG: Diese Migration legt KEINE PII-Felder an
-- (kein whatsapp_number, keine phone_number, keine address,
-- kein real_name). Datenschutz V3.0 strikt eingehalten.

-- ============================================================
-- 1) PROFILES erweitern
-- ============================================================
alter table profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists region text,
  add column if not exists creator_category text,
  add column if not exists live_format text,
  add column if not exists telegram_username text,
  add column if not exists allow_website_showcase boolean not null default false,
  add column if not exists allow_partner_cooperations boolean not null default false,
  add column if not exists allow_metrics_sharing boolean not null default false;

-- region nur DACH+ erlauben
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_region_check'
  ) then
    alter table profiles
      add constraint profiles_region_check
      check (region is null or region in ('DE','AT','CH','LI'));
  end if;
end$$;

-- creator_category + live_format Length-Guard (frei waehlbar in UI)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_creator_category_check'
  ) then
    alter table profiles
      add constraint profiles_creator_category_check
      check (creator_category is null or length(creator_category) <= 60);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_live_format_check'
  ) then
    alter table profiles
      add constraint profiles_live_format_check
      check (live_format is null or length(live_format) <= 60);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_telegram_check'
  ) then
    alter table profiles
      add constraint profiles_telegram_check
      check (telegram_username is null or length(telegram_username) <= 64);
  end if;
end$$;

-- Index fuer Auth-Gate-Lookup
create index if not exists profiles_onboarding_completed_idx
  on profiles (onboarding_completed);

-- ============================================================
-- 2) CREATOR_MONTHLY_METRICS — Backstage-Sync-Ziel
-- ============================================================
create table if not exists creator_monthly_metrics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  tiktok_username text not null,
  month date not null,
  valid_live_days integer not null default 0,
  live_minutes_total integer not null default 0,
  live_hours_display numeric(7,1),
  average_viewers integer not null default 0,
  last_live_date date,
  activity_status text check (activity_status in ('aktiv','unregelmaessig','inaktiv')),
  synced_at timestamptz not null default now(),
  source text not null default 'backstage',
  unique(profile_id, month)
);

create index if not exists creator_monthly_metrics_profile_month_idx
  on creator_monthly_metrics (profile_id, month desc);

create index if not exists creator_monthly_metrics_tiktok_idx
  on creator_monthly_metrics (tiktok_username);

alter table creator_monthly_metrics enable row level security;

-- Own-read: creator sieht nur eigene Monatsdaten
drop policy if exists cmm_own_read on creator_monthly_metrics;
create policy cmm_own_read
  on creator_monthly_metrics for select
  using (profile_id = auth.uid());

-- Admin-read: voller Zugriff
drop policy if exists cmm_admin_read on creator_monthly_metrics;
create policy cmm_admin_read
  on creator_monthly_metrics for select
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Manager-read: nur eigene Creator (manager_id = self)
drop policy if exists cmm_manager_read on creator_monthly_metrics;
create policy cmm_manager_read
  on creator_monthly_metrics for select
  using (exists (
    select 1 from profiles me
    where me.id = auth.uid()
      and me.role = 'manager'
      and exists (
        select 1 from profiles target
        where target.id = creator_monthly_metrics.profile_id
          and target.manager_id = me.id
      )
  ));

-- Insert/Update/Delete: nur via Service-Role (Sync-Cron). Keine RLS-Policies
-- fuer authenticated → bypass nur via service_role-Key, der RLS umgeht.

-- ============================================================
-- 3) ZOE_APP_CONNECTION_CODES — One-Time Codes ZOE App ↔ Portal
-- ============================================================
create table if not exists zoe_app_connection_codes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  tiktok_username text not null,
  code text unique not null,
  status text not null default 'pending'
    check (status in ('pending','used','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists zoe_app_codes_profile_status_idx
  on zoe_app_connection_codes (profile_id, status);

create index if not exists zoe_app_codes_code_idx
  on zoe_app_connection_codes (code);

alter table zoe_app_connection_codes enable row level security;

-- Own-read: creator sieht nur eigene Codes
drop policy if exists zacc_own_read on zoe_app_connection_codes;
create policy zacc_own_read
  on zoe_app_connection_codes for select
  using (profile_id = auth.uid());

-- Admin-read: voller Zugriff
drop policy if exists zacc_admin_read on zoe_app_connection_codes;
create policy zacc_admin_read
  on zoe_app_connection_codes for select
  using (exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Insert/Update/Delete: nur via Service-Role (API-Route).
-- Creator klickt Button → /api/zoe-app/request-code → Service-Role insert.
-- Bot validiert Code → Service-Role update status='used'.
-- Keine RLS-Insert-Policy fuer authenticated.

-- ============================================================
-- 4) BESTEHENDE ADMIN/MANAGER — onboarding_completed=true
-- WICHTIG: damit das Auth-Gate sie nicht aussperrt sobald
--          es im Code aktiviert wird.
-- ============================================================
update profiles
   set onboarding_completed = true,
       onboarding_completed_at = coalesce(onboarding_completed_at, now())
 where role in ('admin','manager');
