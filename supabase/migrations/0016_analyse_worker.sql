-- ZOE Star Agency — Block F V2 · Worker-Foundation
-- Erweitert notification_type um 'analysis' damit der Worker dem Creator
-- eine in-app + email Notification senden kann wenn die Analyse fertig ist.
-- Idempotent (alter type add value if not exists).

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'notification_type' and e.enumlabel = 'analysis'
  ) then
    alter type notification_type add value 'analysis';
  end if;
end$$;

-- 2) Worker-Service-Index: schnelles Polling nach status='submitted' oder 'queued'
create index if not exists aa_worker_pending_idx
  on account_analyses (status, created_at)
  where status in ('submitted','queued');

create index if not exists lpr_worker_pending_idx
  on live_performance_reports (status, created_at)
  where status in ('submitted','queued');
