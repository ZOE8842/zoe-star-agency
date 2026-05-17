-- Migration 0052 · profiles.language CHECK-Constraint
-- Bestehende Spalte: profiles.language text default 'de'.
-- Werte aktuell: 'de' (34) + 'fr' (2). Kein Constraint vorhanden.
-- Constraint sichert das supported set ab und verhindert Tippfehler/Garbage.
--
-- Supported Locales (matched lib/i18n/config.ts):
--   de, en, fr, tr, pt, ar

-- Vorher Bereinigung: alle non-supported Werte → 'de' (Fallback).
update public.profiles
set language = 'de'
where language is not null
  and language not in ('de','en','fr','tr','pt','ar');

-- NOT NULL + Default 'de' + CHECK
alter table public.profiles
  alter column language set default 'de';

update public.profiles set language = 'de' where language is null;

alter table public.profiles
  alter column language set not null;

alter table public.profiles
  drop constraint if exists profiles_language_supported;
alter table public.profiles
  add constraint profiles_language_supported
  check (language in ('de','en','fr','tr','pt','ar'));

notify pgrst, 'reload schema';
