-- V1.7 · Event-Sichtbarkeit + Allowed-Profiles
-- Events koennen jetzt fuer alle Creator (default) ODER fuer ausgewaehlte
-- Creator angelegt werden. Bei "selected" steuert event_allowed_profiles
-- wer den Event sehen kann.
-- Idempotent.

alter table events
  add column if not exists visibility_mode text default 'all'
    check (visibility_mode in ('all', 'selected'));

create index if not exists events_visibility_idx on events (visibility_mode);

create table if not exists event_allowed_profiles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(event_id, profile_id)
);

create index if not exists eap_event_idx on event_allowed_profiles (event_id);
create index if not exists eap_profile_idx on event_allowed_profiles (profile_id);

alter table event_allowed_profiles enable row level security;

-- Own-Read: Creator sieht eigene Allow-Eintraege (= sieht in welchen Events
-- er drin ist)
drop policy if exists eap_own_read on event_allowed_profiles;
create policy eap_own_read on event_allowed_profiles for select
  using (profile_id = auth.uid());

-- Admin/Manager: full CRUD
drop policy if exists eap_admin_all on event_allowed_profiles;
create policy eap_admin_all on event_allowed_profiles for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'manager')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'manager')
    )
  );

notify pgrst, 'reload schema';
