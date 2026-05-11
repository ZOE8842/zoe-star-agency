-- ZOE Star Agency — Academy-Schema-Fix
-- Repariert academy_challenges + academy_challenge_submissions an das
-- echte Schema in Production. Beide Tabellen existieren bereits mit
-- weniger Spalten als 0024 angenommen hat.
--
-- Strategie: NUR fehlende Spalten ADD COLUMN IF NOT EXISTS. KEIN DROP
-- bestehender Spalten. KEIN check-constraint Konflikt mit existing
-- status-Spalte.
--
-- Schema-Probe vorab (gefunden 2026-05-11):
--   academy_challenges: id, status, slug, title, description,
--                       starts_at, ends_at, created_at
--   academy_challenge_submissions: id, created_at, profile_id, challenge_id
--   academy_progress: id, status, user_id, lesson_id, module_id
--   academy_lesson_reads: id, category_slug, profile_id, lesson_slug
--   profiles: id, role, status, display_name, tiktok_username, avatar_url, ...

-- ============================================================
-- 0023 · Profile-Kontakte + Geburtstag
-- ============================================================

alter table profiles
  add column if not exists instagram_username text,
  add column if not exists whatsapp_number text,
  add column if not exists birthday_day smallint,
  add column if not exists birthday_month smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_instagram_username_check') then
    alter table profiles add constraint profiles_instagram_username_check
      check (instagram_username is null or length(instagram_username) <= 64);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_whatsapp_number_check') then
    alter table profiles add constraint profiles_whatsapp_number_check
      check (whatsapp_number is null or whatsapp_number ~* '^\+?[0-9 ()-]{4,32}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_birthday_day_check') then
    alter table profiles add constraint profiles_birthday_day_check
      check (birthday_day is null or (birthday_day between 1 and 31));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_birthday_month_check') then
    alter table profiles add constraint profiles_birthday_month_check
      check (birthday_month is null or (birthday_month between 1 and 12));
  end if;
end$$;


-- ============================================================
-- 0024-FIX · academy_challenges
-- Tabelle existiert. Fehlende App-Layer-Spalten ergaenzen.
-- ============================================================

alter table academy_challenges
  add column if not exists is_active boolean not null default true,
  add column if not exists body_md text,
  add column if not exists category_slug text,
  add column if not exists reward_label text,
  add column if not exists created_by uuid references profiles(id) on delete set null;

-- Partial-Index sicher erstellbar weil is_active jetzt existiert.
create index if not exists ac_active_idx on academy_challenges (is_active, starts_at desc)
  where is_active = true;

alter table academy_challenges enable row level security;

drop policy if exists ac_read_all on academy_challenges;
create policy ac_read_all on academy_challenges for select
  using (auth.uid() is not null);

drop policy if exists ac_admin_all on academy_challenges;
create policy ac_admin_all on academy_challenges for all
  using (exists (select 1 from profiles where profiles.id = auth.uid()
                  and profiles.role in ('admin','manager')))
  with check (exists (select 1 from profiles where profiles.id = auth.uid()
                  and profiles.role in ('admin','manager')));


-- ============================================================
-- 0024-FIX · academy_challenge_submissions
-- Tabelle hat nur id, created_at, profile_id, challenge_id.
-- Wir adden alle App-Felder. status bekommt einen klaren CHECK,
-- wird IF NOT EXISTS angelegt und der CHECK separat per
-- 'NOT VALID' versucht damit alte rows (gibt es nicht) nicht blocken.
-- ============================================================

alter table academy_challenge_submissions
  add column if not exists body text,
  add column if not exists proof_url text,
  add column if not exists status text not null default 'submitted',
  add column if not exists reviewed_by uuid references profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'acs_status_check') then
    alter table academy_challenge_submissions
      add constraint acs_status_check
      check (status in ('submitted','approved','rejected','winner'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'acs_unique_challenge_profile') then
    alter table academy_challenge_submissions
      add constraint acs_unique_challenge_profile
      unique (challenge_id, profile_id);
  end if;
end$$;

create index if not exists acs_status_idx on academy_challenge_submissions (status, created_at desc);
create index if not exists acs_profile_idx on academy_challenge_submissions (profile_id, created_at desc);

alter table academy_challenge_submissions enable row level security;

drop policy if exists acs_own_read on academy_challenge_submissions;
create policy acs_own_read on academy_challenge_submissions for select
  using (profile_id = auth.uid());

drop policy if exists acs_own_insert on academy_challenge_submissions;
create policy acs_own_insert on academy_challenge_submissions for insert
  with check (profile_id = auth.uid());

drop policy if exists acs_admin_all on academy_challenge_submissions;
create policy acs_admin_all on academy_challenge_submissions for all
  using (exists (select 1 from profiles where profiles.id = auth.uid()
                  and profiles.role in ('admin','manager')))
  with check (exists (select 1 from profiles where profiles.id = auth.uid()
                  and profiles.role in ('admin','manager')));


-- ============================================================
-- 0024-FIX · VIEW academy_creator_xp
-- Erstellt sicher mit echten Spalten-Namen:
--   academy_lesson_reads.profile_id
--   academy_progress.user_id + academy_progress.status
--   academy_challenge_submissions.profile_id + .status
--   profiles.role + profiles.status
-- ============================================================

drop view if exists academy_creator_xp;
create view academy_creator_xp as
  select
    p.id as profile_id,
    p.display_name,
    p.tiktok_username,
    p.avatar_url,
    coalesce(reads.cnt, 0) as lessons_read,
    coalesce(quizzes.cnt, 0) as quizzes_passed,
    coalesce(challenges.cnt, 0) as challenges_won,
    (coalesce(reads.cnt, 0) * 5
     + coalesce(quizzes.cnt, 0) * 25
     + coalesce(challenges.cnt, 0) * 100) as xp_total
  from profiles p
  left join (
    select profile_id, count(*)::int as cnt
    from academy_lesson_reads
    group by profile_id
  ) reads on reads.profile_id = p.id
  left join (
    select user_id as profile_id, count(*)::int as cnt
    from academy_progress
    where status = 'quiz_passed'
    group by user_id
  ) quizzes on quizzes.profile_id = p.id
  left join (
    select profile_id, count(*)::int as cnt
    from academy_challenge_submissions
    where status = 'winner'
    group by profile_id
  ) challenges on challenges.profile_id = p.id
  where p.role = 'creator' and p.status = 'active';

notify pgrst, 'reload schema';
