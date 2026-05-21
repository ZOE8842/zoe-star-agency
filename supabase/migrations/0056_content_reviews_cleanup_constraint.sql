-- Migration 0056 · Content-Cleanup-Constraint
-- Lockerung von content_reviews_check damit nach Abschluss eines Reviews
-- (status IN done/failed/reviewed) der video_storage_path durch das
-- content-cleanup-Cron-Job (/api/cron/content-cleanup) auf NULL gesetzt
-- werden darf — ohne dabei eine Submit-Race zu oeffnen.
--
-- Vorher:
--   CHECK (video_url IS NOT NULL OR video_storage_path IS NOT NULL)
--   → Cleanup-UPDATE auf video_storage_path=NULL schlug fehl wenn
--     video_url ebenfalls NULL (typischer Fall fuer kind='image'
--     mit nur Storage-Upload, kein externer Link).
--
-- Nachher:
--   In aktiven Stati (submitted/queued/processing/in_review) bleibt
--   die URL-oder-Storage-Pflicht.
--   In Abschluss-Stati (done/failed/reviewed) darf beides NULL sein
--   → erlaubt Cleanup nach 5 Tagen.
--
-- Submit-Flow ist NICHT betroffen: Insert mit status='submitted'
-- verlangt weiterhin video_url ODER video_storage_path.

ALTER TABLE content_reviews
DROP CONSTRAINT IF EXISTS content_reviews_check;

ALTER TABLE content_reviews
ADD CONSTRAINT content_reviews_check
CHECK (
  status IN ('done', 'failed', 'reviewed')
  OR video_url IS NOT NULL
  OR video_storage_path IS NOT NULL
);

COMMENT ON CONSTRAINT content_reviews_check ON content_reviews IS
'Aktive Reviews brauchen URL ODER Storage-Path. Nach Abschluss (done/failed/reviewed) darf das Cleanup-Cron beide auf NULL setzen.';
