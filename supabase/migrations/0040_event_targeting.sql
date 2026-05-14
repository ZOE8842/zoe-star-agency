-- 0040_event_targeting.sql
-- Event-Zielgruppen Combo A + D: Category + Language Filter.
-- Erweitert events um optionale target_categories[] + target_languages[].
-- Wenn beide NULL/leer → kein Filter (verhalten wie bisher).
-- Wenn gesetzt → Creator muss matching profile.category UND profile.language haben (AND-Logik).
-- Staff (admin/manager) sieht immer alles.
-- Idempotent.

alter table events
  add column if not exists target_categories text[],
  add column if not exists target_languages text[];

create index if not exists events_target_categories_idx
  on events using gin (target_categories);
create index if not exists events_target_languages_idx
  on events using gin (target_languages);

notify pgrst, 'reload schema';
