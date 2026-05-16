-- Migration 0049 - Legacy-Felder fuer Pre-Maerz-Bonusprogramm
--
-- User-Decision 2026-05-16:
-- Backstage hat vor Maerz 2026 ein anderes Anreiz-System (Aktivitätsaufgabe,
-- Inkrementelle Umsatzaufgabe, Anfaenger*innen-Meilenstein-Bonus). Das neue
-- Tier-System ("Stufen-basierter Umsatzanreiz") kam erst mit Maerz 2026.
--
-- Semantisch sauber: getrennte Spalten statt Slot-Wiederverwendung. Sonst
-- spaeter Chaos bei Analytics, Vergleichen, Trends, Labels.
--
-- Regel:
--   Pre-Maerz (period_month < 2026-03-01): legacy_* gefuellt,
--                                           activity/tier/incremental NULL
--   Ab Maerz (period_month >= 2026-03-01): activity/tier/incremental gefuellt,
--                                          legacy_* NULL
--   total_revenue_usd: in BEIDEN Faellen die tatsaechliche Sum
--                      (Server-Lib berechnet automatisch)

alter table public.creator_revenue_metrics
  add column if not exists legacy_revenue_usd         numeric(10,2),
  add column if not exists legacy_activity_usd        numeric(10,2),
  add column if not exists legacy_incremental_usd     numeric(10,2),
  add column if not exists legacy_beginner_bonus_usd  numeric(10,2),
  add column if not exists legacy_program_label       text;

notify pgrst, 'reload schema';
