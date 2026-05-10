-- ZOE Star Agency — Creator Services Foundation V1
-- Phase A: nur whatsapp_url + Service-Tabellen-Foundation.
-- UI-Module fuer einzelne Services kommen in Phase B+C+D.
-- Idempotent.

-- 1) profiles: WhatsApp-URL (optional) — Link statt Nummer empfohlen
alter table profiles
  add column if not exists whatsapp_url text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_whatsapp_url_check') then
    alter table profiles add constraint profiles_whatsapp_url_check
      check (whatsapp_url is null or whatsapp_url ~* '^https?://');
  end if;
end$$;

-- 2) tiktok_push_requests — Wochen-LIVE-Slots fuer Push-Anfrage
create table if not exists tiktok_push_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  week_start_monday date not null,
  requested_slots jsonb not null default '[]'::jsonb,
  status text not null default 'submitted'
    check (status in ('submitted','reviewed','selected','not_selected','cancelled')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  unique(profile_id, week_start_monday)
);

create index if not exists tpr_profile_week_idx
  on tiktok_push_requests (profile_id, week_start_monday desc);

alter table tiktok_push_requests enable row level security;

drop policy if exists tpr_own_select on tiktok_push_requests;
create policy tpr_own_select on tiktok_push_requests for select
  using (profile_id = auth.uid());

drop policy if exists tpr_own_insert on tiktok_push_requests;
create policy tpr_own_insert on tiktok_push_requests for insert
  with check (profile_id = auth.uid());

drop policy if exists tpr_own_update on tiktok_push_requests;
create policy tpr_own_update on tiktok_push_requests for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists tpr_admin_all on tiktok_push_requests;
create policy tpr_admin_all on tiktok_push_requests for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- 3) phone_call_requests — Rueckruf-/Termin-Anfrage
create table if not exists phone_call_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  channel text not null check (channel in ('telegram','instagram','whatsapp','phone')),
  contact_value text not null,
  earliest_at timestamptz not null,
  latest_at timestamptz not null,
  note text,
  status text not null default 'open'
    check (status in ('open','planned','done','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists pcr_profile_idx on phone_call_requests (profile_id, created_at desc);

alter table phone_call_requests enable row level security;

drop policy if exists pcr_own on phone_call_requests;
create policy pcr_own on phone_call_requests for select using (profile_id = auth.uid());

drop policy if exists pcr_insert on phone_call_requests;
create policy pcr_insert on phone_call_requests for insert with check (profile_id = auth.uid());

drop policy if exists pcr_admin_all on phone_call_requests;
create policy pcr_admin_all on phone_call_requests for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- 4) live_absences — Krank/Technik/etc.
create table if not exists live_absences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  reason text not null check (reason in ('krank','technik','tiktok_sperre','privat','verschoben','sonstiges')),
  period_start date not null,
  period_end date not null,
  note text,
  status text not null default 'submitted'
    check (status in ('submitted','seen','resolved')),
  created_at timestamptz not null default now()
);

create index if not exists la_profile_period_idx on live_absences (profile_id, period_start desc);

alter table live_absences enable row level security;

drop policy if exists la_own on live_absences;
create policy la_own on live_absences for select using (profile_id = auth.uid());

drop policy if exists la_insert on live_absences;
create policy la_insert on live_absences for insert with check (profile_id = auth.uid());

drop policy if exists la_admin_all on live_absences;
create policy la_admin_all on live_absences for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- 5) match_requests — Big-Match-Partner-Anfrage
create table if not exists match_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  desired_at timestamptz not null,
  match_kind text,
  opponent_strength text,
  language_pref text,
  note text,
  status text not null default 'requested'
    check (status in ('requested','reviewing','partner_found','planned','done','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists mr_profile_idx on match_requests (profile_id, desired_at desc);

alter table match_requests enable row level security;

drop policy if exists mr_own on match_requests;
create policy mr_own on match_requests for select using (profile_id = auth.uid());

drop policy if exists mr_insert on match_requests;
create policy mr_insert on match_requests for insert with check (profile_id = auth.uid());

drop policy if exists mr_admin_all on match_requests;
create policy mr_admin_all on match_requests for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- 6) content_reviews — Video/Content-Helfer
create table if not exists content_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  video_url text,
  video_storage_path text,
  ai_score jsonb,
  manual_note text,
  status text not null default 'submitted'
    check (status in ('submitted','in_review','reviewed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (video_url is not null or video_storage_path is not null)
);

create index if not exists cr_profile_idx on content_reviews (profile_id, created_at desc);

alter table content_reviews enable row level security;

drop policy if exists cr_own on content_reviews;
create policy cr_own on content_reviews for select using (profile_id = auth.uid());

drop policy if exists cr_insert on content_reviews;
create policy cr_insert on content_reviews for insert with check (profile_id = auth.uid());

drop policy if exists cr_admin_all on content_reviews;
create policy cr_admin_all on content_reviews for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
