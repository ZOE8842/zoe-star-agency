-- 0035_event_registration_optional.sql
-- Events koennen jetzt OHNE Anmeldung sein (reine Info / Ankuendigung).
-- Default = true (bisheriges Verhalten bleibt), Admin kann pro Event toggeln.
-- Idempotent.

alter table events
  add column if not exists requires_registration boolean not null default true;

create index if not exists events_requires_registration_idx
  on events (requires_registration);

notify pgrst, 'reload schema';
