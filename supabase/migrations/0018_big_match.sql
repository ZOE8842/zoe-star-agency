-- ZOE Star Agency — Phase D · Big Match
-- Premium-Match-Anfrage: Creator stellt Anfrage, ZOE prueft und plant.
-- Kein Self-Service-Matching, keine automatische Gegner-Zuweisung,
-- keine offene Creator-Liste — agencygefuehrt.
-- Idempotent.

create table if not exists match_requests (
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

create index if not exists mr_profile_idx on match_requests (profile_id, created_at desc);
create index if not exists mr_status_idx on match_requests (status, created_at desc);
create index if not exists mr_open_idx on match_requests (status, created_at desc)
  where status in ('requested','in_review','partner_found');

alter table match_requests enable row level security;

drop policy if exists mr_own_read on match_requests;
create policy mr_own_read on match_requests for select
  using (profile_id = auth.uid());

drop policy if exists mr_own_insert on match_requests;
create policy mr_own_insert on match_requests for insert
  with check (profile_id = auth.uid());

drop policy if exists mr_admin_all on match_requests;
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

-- updated_at-Trigger
create or replace function set_match_requests_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_mr_updated_at on match_requests;
create trigger trg_mr_updated_at
  before update on match_requests
  for each row execute function set_match_requests_updated_at();
