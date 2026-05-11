-- ZOE Star Agency — Academy V2 · Challenges + Winners
-- Weekly-Challenges + Leaderboard. XP wird on-the-fly aus lesson_reads
-- + quiz_passed berechnet (kein eigenes XP-Field).
-- Idempotent.

create table if not exists academy_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  body_md text,
  category_slug text,
  reward_label text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ac_active_idx on academy_challenges
  (is_active, starts_at desc)
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


-- Challenge-Teilnahme + Submission
create table if not exists academy_challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references academy_challenges(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  body text,
  proof_url text,
  status text not null default 'submitted'
    check (status in ('submitted','approved','rejected','winner')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (challenge_id, profile_id)
);

create index if not exists acs_status_idx on academy_challenge_submissions
  (status, created_at desc);
create index if not exists acs_profile_idx on academy_challenge_submissions
  (profile_id, created_at desc);

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


-- Leaderboard-View: XP aus academy_lesson_reads + academy_progress (Quiz-Passes)
-- Wir aggregieren beides als simples View, damit Hub-Page schnell laden kann.
create or replace view academy_creator_xp as
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
    select profile_id, count(*) as cnt
    from academy_lesson_reads
    group by profile_id
  ) reads on reads.profile_id = p.id
  left join (
    select user_id as profile_id, count(*) as cnt
    from academy_progress
    where status = 'quiz_passed'
    group by user_id
  ) quizzes on quizzes.profile_id = p.id
  left join (
    select profile_id, count(*) as cnt
    from academy_challenge_submissions
    where status = 'winner'
    group by profile_id
  ) challenges on challenges.profile_id = p.id
  where p.role = 'creator' and p.status = 'active';

-- View RLS: read fuer eingeloggte User. Views erben RLS der base-Tabellen,
-- aber academy_lesson_reads hat schon eigene Policies — passt.

notify pgrst, 'reload schema';
