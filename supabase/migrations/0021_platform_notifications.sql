-- ZOE Star Agency — Platform-Notifications V1
-- Externe Push-Queue fuer TikTok-DM-Bridge via @zoe.star.agency.
-- Inbox + Activity-Feed bleiben primary; diese Tabelle ist die
-- Schnittstelle zum lokalen Sende-Worker.
-- Idempotent.

create table if not exists platform_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in (
    'match_scheduled','match_partner_found','match_rejected',
    'analysis_ready','showcase_approved','event_started',
    'academy_challenge','inactivity_reminder','service_update',
    'live_warning','push_selected'
  )),
  priority smallint not null default 5
    check (priority between 1 and 9),
  title text,
  body text not null,
  context_url text,
  status text not null default 'queued'
    check (status in ('queued','sending','sent','failed','skipped')),
  attempts smallint not null default 0,
  last_attempt_at timestamptz,
  error_message text,
  sent_at timestamptz,
  cooldown_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pn_queue_idx on platform_notifications
  (status, priority asc, created_at asc)
  where status in ('queued','sending');

create index if not exists pn_profile_idx on platform_notifications
  (profile_id, created_at desc);

create index if not exists pn_cooldown_idx on platform_notifications
  (profile_id, cooldown_until desc)
  where cooldown_until is not null;

alter table platform_notifications enable row level security;

drop policy if exists pn_own_read on platform_notifications;
create policy pn_own_read on platform_notifications for select
  using (profile_id = auth.uid());

drop policy if exists pn_admin_all on platform_notifications;
create policy pn_admin_all on platform_notifications for all
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

notify pgrst, 'reload schema';
