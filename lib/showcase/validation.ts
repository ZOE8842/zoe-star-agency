// Showcase-Validation · zentrale Source-of-Truth
// Pflicht: 2 Bilder fuer Public-Sichtbarkeit + Admin-Pruefung.

export interface ShowcaseImageEntry {
  url: string;
  type?: string;
  position?: number;
}

export interface ShowcaseLike {
  showcase_images: ShowcaseImageEntry[] | unknown;
  showcase_image?: string | null;
}

/**
 * Liefert die Anzahl gueltiger Bilder (https-URL).
 */
export function showcaseImageCount(s: ShowcaseLike | null | undefined): number {
  if (!s) return 0;
  const arr = Array.isArray(s.showcase_images) ? (s.showcase_images as ShowcaseImageEntry[]) : [];
  const valid = arr.filter((i) => i && typeof i.url === "string" && /^https?:\/\//i.test(i.url));
  return valid.length;
}

/**
 * Showcase gilt als komplett wenn 2 Bilder vorhanden sind.
 */
export function isShowcaseComplete(s: ShowcaseLike | null | undefined): boolean {
  return showcaseImageCount(s) >= 2;
}

/**
 * Showcase bereit zur Admin-Pruefung:
 * 2 Bilder + Email-Bestaetigung vorhanden.
 */
export function isShowcaseReadyForReview(
  s: ShowcaseLike | null | undefined,
  allow_website_showcase_confirmed: boolean,
): boolean {
  return isShowcaseComplete(s) && allow_website_showcase_confirmed === true;
}

/**
 * Verwendet von approveShowcase + Public-Query: 4-Stufen-Gate.
 */
export function isShowcasePublic(
  s: { is_approved?: boolean; is_featured?: boolean } & ShowcaseLike,
  allow_website_showcase_confirmed: boolean,
): boolean {
  return (
    s.is_approved === true &&
    s.is_featured === true &&
    isShowcaseComplete(s) &&
    allow_website_showcase_confirmed === true
  );
}
