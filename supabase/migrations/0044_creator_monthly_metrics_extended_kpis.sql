-- ZOE Star Agency · Migration 0044 · Phase-5 Prep
-- Erweitert creator_monthly_metrics um 10 neue KPI-Spalten fuer Performance-Intelligenz
-- (Ranking, Score, Warnungen, KI-Auswertungen).
--
-- ADDITIV: bestehende 23 Rows bleiben erhalten. Alle neuen Spalten nullable,
-- ausser diamonds_month das default 0 hat (haeufigste Anzeige-Spalte, Null wuerde
-- "—" im Dashboard erzeugen statt "0" bei inaktiven Creators).
--
-- bigint fuer Felder die theoretisch Millionen erreichen koennen (diamonds,
-- impressions, live_views, gifts_count). integer fuer kleinere Counts.
-- numeric (ohne precision) fuer Prozent-Werte gift_rate + ctr.
--
-- Idempotent (IF NOT EXISTS).

alter table creator_monthly_metrics
  add column if not exists diamonds_month        bigint  not null default 0,
  add column if not exists gift_rate             numeric,
  add column if not exists impressions           bigint,
  add column if not exists live_views            bigint,
  add column if not exists followers_gained      integer,
  add column if not exists ctr                   numeric,
  add column if not exists watchtime_avg_seconds integer,
  add column if not exists streams_count         integer,
  add column if not exists gifts_count           bigint,
  add column if not exists gifters_count         integer;

notify pgrst, 'reload schema';
