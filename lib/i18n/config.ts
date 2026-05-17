// i18n-Architektur
// Phase 1: UI-Switch + Default DE
// Phase 2 (eigener Schub): echte Translation-Files + next-intl-Integration

export const LOCALES = ["de", "en", "fr", "tr", "pt", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  tr: "Türkçe",
  pt: "Português",
  ar: "العربية",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  fr: "FR",
  tr: "TR",
  pt: "PT",
  ar: "AR",
};

// RTL-Sprachen (fuer dir-Attribut / Layout-Spiegelung)
export const RTL_LOCALES: ReadonlySet<Locale> = new Set(["ar"]);

// Welche Locales sind bereits voll uebersetzt?
// Aktuell nur DE - andere haben Stub-Files mit DE-Fallback-Strings.
// Vollausbau aller Strings ist eigener Schub.
export const AVAILABLE_LOCALES: Locale[] = ["de"];

export function isLocaleAvailable(locale: Locale): boolean {
  return AVAILABLE_LOCALES.includes(locale);
}

export function isValidLocale(x: unknown): x is Locale {
  return typeof x === "string" && (LOCALES as readonly string[]).includes(x);
}

export function normalizeLocale(x: unknown): Locale {
  return isValidLocale(x) ? x : DEFAULT_LOCALE;
}
