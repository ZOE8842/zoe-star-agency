-- Migration 0065 · pg_trgm aus public nach extensions
--
-- Security-Advisor "Extension in Public" (2026-09-20). Die Extension gehoert
-- supabase_admin, deshalb scheitert `alter extension ... set schema` als
-- postgres mit "must be owner of extension". Der Weg ueber drop + create ist
-- erlaubt (postgres darf Extensions anlegen) und gefahrlos, weil nichts in
-- der DB von pg_trgm abhaengt: kein Index mit gin_trgm_ops/gist_trgm_ops,
-- keine Funktion, keine View (pg_depend deptype 'n' = 0, geprueft 2026-09-20).
-- search_path von postgres/authenticator enthaelt extensions bereits.
--
-- Reversibel: drop extension pg_trgm; create extension pg_trgm schema public;

drop extension if exists pg_trgm;
create extension if not exists pg_trgm schema extensions;
