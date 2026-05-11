-- ZOE Star Agency — Inbox V2 · Notification-Bundles + Activity-Feed-Erweiterung
-- Bundle-Logic: 3 Analyse-fertig in 24h -> 1 gebuendelter Eintrag.
-- Activity-Feed: zusaetzliche Types fuer Showcase / Big-Match / Milestones.
-- Idempotent.

-- 1) notifications: Bundle-Felder
alter table notifications
  add column if not exists bundle_key text,
  add column if not exists bundle_count integer not null default 1,
  add column if not exists bundle_data jsonb not null default '{}'::jsonb,
  add column if not exists external_push_id uuid references platform_notifications(id) on delete set null;

create index if not exists notifications_bundle_idx
  on notifications (user_id, bundle_key, status)
  where bundle_key is not null and status = 'unread';

-- 2) activity_feed: erweiterte Types fuer Inbox-V2-Sichtbarkeit
alter table activity_feed drop constraint if exists activity_feed_type_check;
alter table activity_feed add constraint activity_feed_type_check
  check (type in (
    'creator_live','match_call','event_started','academy_lesson',
    'tiktok_push_selected','agency_news','creator_joined',
    'match_scheduled','showcase_approved','analysis_done',
    'creator_milestone','academy_winner','agency_announcement'
  ));

-- 3) Realtime fuer notifications + messages aktivieren
-- (Supabase setzt das ueber publication `supabase_realtime`)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
exception when others then null;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
exception when others then null;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'activity_feed'
  ) then
    alter publication supabase_realtime add table activity_feed;
  end if;
exception when others then null;
end$$;

notify pgrst, 'reload schema';
