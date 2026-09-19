-- Migration 0063 · creator_live_performance_monthly · compare_pct verbreitern
--
-- Befund 2026-09-20: die sechs *_compare_pct-Spalten waren numeric(7,2),
-- Maximum also 99.999,99 %. Ein Creator, der nach einer Pause zurueckkommt,
-- sprengt das sofort (diana88b September: 113.840 Diamonds gegen Vergleichs-
-- wert 6 = +1.897.233 %). Der Autopilot-Push meldete "numeric field overflow"
-- und liess die Zeile aus, spaetere Laeufe schrieben NULL statt Wert.
--
-- numeric(12,2) reicht bis +-9.999.999.999,99 %. Additiv, kein Datenverlust,
-- alle bestehenden Werte passen in den groesseren Typ.
-- Reversibel: alter column ... type numeric(7,2) (nur wenn keine Werte > 99999.99).

alter table public.creator_live_performance_monthly
  alter column diamonds_compare_pct      type numeric(12,2),
  alter column live_days_compare_pct     type numeric(12,2),
  alter column live_duration_compare_pct type numeric(12,2),
  alter column streams_compare_pct       type numeric(12,2),
  alter column followers_compare_pct     type numeric(12,2),
  alter column watch_seconds_compare_pct type numeric(12,2);

notify pgrst, 'reload schema';
