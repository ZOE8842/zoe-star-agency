-- ZOE Star Agency — Block F · Account Analyse + LIVE Performance
-- Migriert /zoestart + /zoecheck Logik als Web-Module.
-- Idempotent.

-- 1) account_analyses (ehemals /zoestart)
create table if not exists account_analyses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  target_tiktok_username text not null,
  status text not null default 'submitted'
    check (status in ('submitted','queued','processing','done','failed','reviewed','in_review')),
  ai_provider text,
  ai_model text,
  cost_usd numeric(10,4) default 0,
  scores jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  image_suggestions jsonb not null default '[]'::jsonb,
  raw_response jsonb,
  error_message text,
  manual_note text,
  created_at timestamptz not null default now(),
  processing_started_at timestamptz,
  completed_at timestamptz
);

create index if not exists aa_profile_idx on account_analyses (profile_id, created_at desc);
create index if not exists aa_status_idx on account_analyses (status, created_at desc);
create index if not exists aa_target_idx on account_analyses (target_tiktok_username);

alter table account_analyses enable row level security;

drop policy if exists aa_own on account_analyses;
create policy aa_own on account_analyses for select using (profile_id = auth.uid());

drop policy if exists aa_insert on account_analyses;
create policy aa_insert on account_analyses for insert with check (profile_id = auth.uid());

drop policy if exists aa_admin_all on account_analyses;
create policy aa_admin_all on account_analyses for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));


-- 2) live_performance_reports (ehemals /zoecheck)
create table if not exists live_performance_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  period_label text not null,
  period_start date,
  period_end date,
  status text not null default 'submitted'
    check (status in ('submitted','queued','processing','done','failed','reviewed','in_review')),
  ai_provider text,
  ai_model text,
  cost_usd numeric(10,4) default 0,
  kpi jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  weekly_plan jsonb not null default '[]'::jsonb,
  raw_response jsonb,
  error_message text,
  manual_note text,
  created_at timestamptz not null default now(),
  processing_started_at timestamptz,
  completed_at timestamptz
);

create index if not exists lpr_profile_idx on live_performance_reports (profile_id, created_at desc);
create index if not exists lpr_status_idx on live_performance_reports (status, created_at desc);

alter table live_performance_reports enable row level security;

drop policy if exists lpr_own on live_performance_reports;
create policy lpr_own on live_performance_reports for select using (profile_id = auth.uid());

drop policy if exists lpr_insert on live_performance_reports;
create policy lpr_insert on live_performance_reports for insert with check (profile_id = auth.uid());

drop policy if exists lpr_admin_all on live_performance_reports;
create policy lpr_admin_all on live_performance_reports for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
