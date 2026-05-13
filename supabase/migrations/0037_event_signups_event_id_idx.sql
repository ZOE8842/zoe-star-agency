-- 0037_event_signups_event_id_idx.sql
-- Audit P2-8. event_signups hat nur creator_id-Index aus 0001, aber Hot-Paths
-- (Admin-Event-Detail-Page, Creator-Detail-Page) filtern nach event_id +
-- status. Composite-Index beschleunigt beides.
-- Idempotent.

create index if not exists event_signups_event_status_idx
  on event_signups (event_id, status);
