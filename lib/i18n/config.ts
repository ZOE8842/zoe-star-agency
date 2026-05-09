// i18n-Architektur
// Phase 1: UI-Switch + Default DE
// Phase 2 (eigener Schub): echte Translation-Files + next-intl-Integration

export const LOCALES = ["de", "en", "fr", "tr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "de";

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  tr: "Türkçe",
};

export const LOCALE_SHORT: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  fr: "FR",
  tr: "TR",
};

// Welche Locales sind bereits voll uebersetzt?
// Aktuell nur DE — vollständige Übersetzungen für EN/FR/TR sind eigener Schub.
export const AVAILABLE_LOCALES: Locale[] = ["de"];

export function isLocaleAvailable(locale: Locale): boolean {
  return AVAILABLE_LOCALES.includes(locale);
}
