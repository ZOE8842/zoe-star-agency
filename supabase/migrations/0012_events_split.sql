-- ZOE Star Agency — Events Split TikTok / Agency
-- Block B der Plattform-V2-Etappe.
-- Idempotent.

alter table events
  add column if not exists source text default 'agency',
  add column if not exists registration_url text,
  add column if not exists prize_description text,
  add column if not exists winners jsonb not null default '[]'::jsonb,
  add column if not exists rules text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_source_check') then
    alter table events add constraint events_source_check
      check (source in ('tiktok','agency'));
  end if;
end$$;

create index if not exists events_source_idx on events (source);

-- RLS: Public-Read fuer non-draft Events nicht limitieren —
-- existing 0006_phase456 hat bereits open/upcoming-Logik, wir
-- ergaenzen nichts.
