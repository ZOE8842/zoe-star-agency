-- ZOE Star Agency — Phase D · Big Match Schema-Align
-- Bug-Fix: In Migration 0009 wurde match_requests bereits mit Stub-Schema
-- angelegt (desired_at NOT NULL, match_kind, opponent_strength, language_pref,
-- note + Status-Werte 'reviewing'/'planned'). Migration 0018 hatte
-- create-if-not-exists und wurde daher uebersprungen, das App-Layer-Schema
-- (desired_date, desired_time, own_level, match_type, country, goal,
-- message, scheduled_for, admin_note, updated_at + Status 'in_review',
-- 'scheduled') fehlte komplett.
--
-- Da die Tabelle in Production 0 Rows hat, droppen wir sie sauber und
-- legen sie 1:1 mit dem App-Layer-Schema neu an.
-- Idempotent.

drop table if exists match_requests cascade;

create table match_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  desired_date date,
  desired_time text,
  own_level text not null,
  match_type text not null,
  desired_opponent_level text,
  language text,
  country text,
  goal text,
  message text,
  status text not null default 'requested'
    check (status in ('requested','in_review','partner_found','scheduled','done','rejected')),
  admin_note text,
  scheduled_for timestamptz,
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mr_profile_idx on match_requests (profile_id, created_at desc);
create index mr_status_idx on match_requests (status, created_at desc);
create index mr_open_idx on match_requests (status, created_at desc)
  where status in ('requested','in_review','partner_found');

alter table match_requests enable row level security;

create policy mr_own_read on match_requests for select
  using (profile_id = auth.uid());

create policy mr_own_insert on match_requests for insert
  with check (profile_id = auth.uid());

create policy mr_admin_all on match_requests for all
  using (
    exists (select 1 from profiles
            where profiles.id = auth.uid()
              and profiles.role in ('admin','manager'))
  )
  with check (
    exists (select 1 from profiles
            where profiles.id = auth.uid()
              and profiles.role in ('admin','manager'))
  );

create or replace function set_match_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger trg_mr_updated_at
  before update on match_requests
  for each row execute function set_match_requests_updated_at();

-- Schema-Cache-Refresh forcieren
notify pgrst, 'reload schema';
