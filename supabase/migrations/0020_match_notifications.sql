-- ZOE Star Agency — Phase D · Big-Match-Notifications + Activity-Feed-Erweiterung
-- 1) notification_type bekommt 'match' damit Worker einen Inbox-Eintrag
--    setzen kann ohne reminder/message-Type zu missbrauchen
-- 2) activity_feed.type bekommt 'match_scheduled' fuer Public-Roster-Feed
-- Idempotent.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'notification_type' and e.enumlabel = 'match'
  ) then
    alter type notification_type add value 'match';
  end if;
end$$;

alter table activity_feed drop constraint if exists activity_feed_type_check;
alter table activity_feed add constraint activity_feed_type_check
  check (type in (
    'creator_live','match_call','event_started','academy_lesson',
    'tiktok_push_selected','agency_news','creator_joined',
    'match_scheduled'
  ));

notify pgrst, 'reload schema';
