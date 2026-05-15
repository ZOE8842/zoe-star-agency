-- ZOE Star Agency · Migration 0042
-- profiles.tiktok_handle_normalized — generierte Spalte fuer deterministischen
-- Backstage-Metrics-Sync. Enthaelt lower(strip(@), strip(whitespace)) auf
-- tiktok_username. Bei leerem/NULL-Wert ist normalized NULL.
--
-- Zweck: Backstage liefert handles als a-z0-9._ — wir matchen profiles
-- ueber diese normalisierte Spalte statt jedes Mal lower()/replace() in
-- jeder Query zu kalkulieren. Index macht das deterministisch + schnell.
--
-- Idempotent (IF NOT EXISTS auf Spalte + Index).

-- Normalisierungs-Pipeline (Reihenfolge bewusst, deckt sich 1:1 mit
-- normalizeHandle() in lib/sync/backstage-metrics.ts):
--   1) coalesce(NULL → '')
--   2) ALLEN whitespace strippen (auch Tabs, Newlines, Innen-Spaces) — vor jeder Operation
--   3) lower()
--   4) fuehrendes @ entfernen
--   5) leeres Result → NULL
alter table profiles
  add column if not exists tiktok_handle_normalized text
  generated always as (
    nullif(
      regexp_replace(
        lower(regexp_replace(coalesce(tiktok_username, ''), '\s+', '', 'g')),
        '^@', ''
      ),
      ''
    )
  ) stored;

create index if not exists profiles_tiktok_handle_normalized_idx
  on profiles (tiktok_handle_normalized);

-- Bewusst KEIN UNIQUE-Constraint: Mehrdeutigkeiten sollen vom Sync-Endpoint
-- als "ambiguous match" gemeldet werden, nicht hart vom DB-Layer geblockt.
-- Aktueller Stand: 0 Duplikate (verifiziert vor Migration).

notify pgrst, 'reload schema';
