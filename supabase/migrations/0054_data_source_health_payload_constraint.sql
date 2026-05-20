-- Migration 0054 · CDX-1 Stop-the-Bleed
-- Pflicht-Constraint: Bei ok=false MUSS error_message gesetzt sein.
-- Verhindert strukturelle silent FAILs in Cron-Health-Logging.
--
-- Source-of-Truth fuer Health-Status: data_source_health.error_message
-- darf bei ok=false niemals NULL sein. Cron-Routes die das verletzten
-- (z.B. content-cleanup, notify-ranking) werden in CDX-1 zusaetzlich
-- gefixt, damit sie immer eine error_message setzen.

-- 1) Backfill: bestehende ok=false-Rows mit error_message=NULL
--    bekommen einen sentinel-String, damit der CHECK nicht beim
--    Insert/Update wegen Legacy-Daten failed.
UPDATE data_source_health
SET error_message = 'legacy_unknown_cause_before_health_payload_constraint'
WHERE ok = false AND error_message IS NULL;

-- 2) CHECK CONSTRAINT
--    ok=true                 → error_message darf NULL sein (kein Fehler)
--    ok=false + error_message=NULL → REJECT
--    ok=false + error_message=text → akzeptieren
ALTER TABLE data_source_health
ADD CONSTRAINT data_source_health_fail_requires_error_message
CHECK (ok = true OR error_message IS NOT NULL);

COMMENT ON CONSTRAINT data_source_health_fail_requires_error_message
ON data_source_health IS
'CDX-1: Jeder FAIL-Eintrag muss eine konkrete error_message tragen. Verhindert silent fails im Dashboard.';
