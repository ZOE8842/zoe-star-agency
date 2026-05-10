-- ZOE Star Agency — Academy V2 Foundation
-- Block D: Progress + Quiz + Challenge.
-- Idempotent. Reihenfolge: CREATE TABLES → Policies.

-- 1) academy_progress — Lesson-Read-Tracking
create table if not exists academy_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category_slug text not null,
  lesson_slug text not null,
  completed_at timestamptz not null default now(),
  unique(profile_id, category_slug, lesson_slug)
);

create index if not exists ap_profile_idx on academy_progress (profile_id);

alter table academy_progress enable row level security;

drop policy if exists ap_own on academy_progress;
create policy ap_own on academy_progress for select
  using (profile_id = auth.uid());

drop policy if exists ap_insert on academy_progress;
create policy ap_insert on academy_progress for insert
  with check (profile_id = auth.uid());

drop policy if exists ap_delete on academy_progress;
create policy ap_delete on academy_progress for delete
  using (profile_id = auth.uid());

drop policy if exists ap_admin_read on academy_progress;
create policy ap_admin_read on academy_progress for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 2) academy_quiz_attempts — Multi-Choice-Quizz-Versuche
create table if not exists academy_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  quiz_slug text not null,
  score integer not null default 0,
  max_score integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  attempted_at timestamptz not null default now()
);

create index if not exists aqa_profile_quiz_idx on academy_quiz_attempts (profile_id, quiz_slug, attempted_at desc);

alter table academy_quiz_attempts enable row level security;

drop policy if exists aqa_own on academy_quiz_attempts;
create policy aqa_own on academy_quiz_attempts for select
  using (profile_id = auth.uid());

drop policy if exists aqa_insert on academy_quiz_attempts;
create policy aqa_insert on academy_quiz_attempts for insert
  with check (profile_id = auth.uid());

drop policy if exists aqa_admin_read on academy_quiz_attempts;
create policy aqa_admin_read on academy_quiz_attempts for select
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 3) academy_challenges — wochentliche Challenges
create table if not exists academy_challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  prize_description text,
  winners jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','closed','archived')),
  created_at timestamptz not null default now()
);

create index if not exists achal_status_idx on academy_challenges (status, ends_at desc);

alter table academy_challenges enable row level security;

drop policy if exists achal_read on academy_challenges;
create policy achal_read on academy_challenges for select
  using (status in ('active','closed','archived'));

drop policy if exists achal_admin_all on academy_challenges;
create policy achal_admin_all on academy_challenges for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 4) academy_challenge_submissions
create table if not exists academy_challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references academy_challenges(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  submission_text text not null check (length(submission_text) between 5 and 1000),
  link_url text,
  created_at timestamptz not null default now(),
  unique(challenge_id, profile_id)
);

create index if not exists acsub_challenge_idx on academy_challenge_submissions (challenge_id, created_at desc);

alter table academy_challenge_submissions enable row level security;

drop policy if exists acsub_own on academy_challenge_submissions;
create policy acsub_own on academy_challenge_submissions for select
  using (profile_id = auth.uid());

drop policy if exists acsub_insert on academy_challenge_submissions;
create policy acsub_insert on academy_challenge_submissions for insert
  with check (profile_id = auth.uid());

drop policy if exists acsub_admin_all on academy_challenge_submissions;
create policy acsub_admin_all on academy_challenge_submissions for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
