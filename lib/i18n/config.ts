// i18n-Architektur (Phase 1: UI-Switch + Default DE)
// Phase 2 (spaeter): echte Translation-Files + next-intl-Integration

export const LOCALES = ["de", "en", "fr", "it", "es", "tr", "ro"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  it: "Italiano",
  es: "Español",
  tr: "Türkçe",
  ro: "Română",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  fr: "FR",
  it: "IT",
  es: "ES",
  tr: "TR",
  ro: "RO",
};

// Welche Locales sind bereits voll uebersetzt? (Phase 1: nur DE)
export const AVAILABLE_LOCALES: Locale[] = ["de"];

export function isLocaleAvailable(locale: Locale): boolean {
  return AVAILABLE_LOCALES.includes(locale);
}
