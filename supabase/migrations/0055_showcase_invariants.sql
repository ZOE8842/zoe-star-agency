-- Migration 0055 · CDX-1 Stop-the-Bleed
-- 1) Showcase-Invariant: is_featured impliziert is_approved.
-- 2) Truth-View v_showcase_public_visible — JOIN von showcase_creators
--    und profiles, plus computed columns is_public_homepage / is_public_coop.
--    Damit kann Admin-UI dieselbe Wahrheit anzeigen wie Public-Resolver.

-- ─────────────────────────────────────────────────────────────
-- 1) INVARIANT
-- ─────────────────────────────────────────────────────────────

-- Defensive Backfill: ein etwaiges Inkonsistenz-Fenster knapp vor
-- der Migration normalisieren. Im Snapshot 2026-05-20 ist die Anzahl
-- der Verletzungen 0; das UPDATE ist dann ein No-Op.
UPDATE showcase_creators
SET is_featured = false
WHERE is_featured = true AND is_approved = false;

ALTER TABLE showcase_creators
ADD CONSTRAINT showcase_featured_requires_approved
CHECK (is_featured = false OR is_approved = true);

COMMENT ON CONSTRAINT showcase_featured_requires_approved
ON showcase_creators IS
'CDX-1: is_featured=true ist nur erlaubt wenn is_approved=true. Verhindert Inkonsistenz "featured aber nicht approved".';

-- ─────────────────────────────────────────────────────────────
-- 2) TRUTH-VIEW
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_showcase_public_visible AS
SELECT
  s.id                                                AS showcase_id,
  s.profile_id,
  s.display_name,
  s.category,
  s.showcase_image,
  s.showcase_images,
  s.tiktok_url,
  s.instagram_url,
  s.is_approved,
  s.is_featured,
  s.sort_order,
  s.approved_at,
  p.tiktok_username,
  p.allow_website_showcase_confirmed              AS web_ok,
  p.allow_partner_cooperations_confirmed          AS coop_ok,
  (s.is_approved AND s.is_featured
     AND p.allow_website_showcase_confirmed)      AS is_public_homepage,
  (s.is_approved AND s.is_featured
     AND p.allow_partner_cooperations_confirmed)  AS is_public_coop
FROM showcase_creators s
JOIN profiles p ON p.id = s.profile_id;

COMMENT ON VIEW v_showcase_public_visible IS
'CDX-1: Truth-View fuer Showcase × Profile-Consent. Liefert pro Showcase-Row Booleans is_public_homepage / is_public_coop, damit Admin-UI dieselbe Public-Sicht zeigen kann wie der Public-Resolver.';

-- DSGVO: Public-Zugriff (anon/authenticated) bewusst verwehren,
-- da die View profile-Felder joint, die nicht oeffentlich sind.
-- Nur service-role darf lesen, was dem aktuellen Public-Resolver entspricht.
REVOKE ALL ON v_showcase_public_visible FROM anon, authenticated;
GRANT SELECT ON v_showcase_public_visible TO service_role;
