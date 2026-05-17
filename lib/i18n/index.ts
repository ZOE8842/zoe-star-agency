// i18n-Loader + Dictionary-Lookup mit Deutsch-Fallback.
//
// USAGE (Server-Component):
//   import { getUserLocale, getDictionary, t } from "@/lib/i18n";
//   const locale = await getUserLocale();       // liest profiles.language
//   const dict = await getDictionary(locale);
//   const title = t(dict, "common.login");
//
// FALLBACK-KASKADE:
//   1) Wert im angeforderten Dictionary (z.B. fr.common.login)
//   2) Wert in DE-Dictionary (Default-Locale)
//   3) Pfad-String als Fallback ("common.login" wenn Key komplett fehlt)
//
// Locale-Quelle:
//   - Server-Component: getUserLocale() liest aus auth-session + profile
//   - Bei kein Login / kein Profile → DEFAULT_LOCALE ("de")

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, LOCALES, type Locale, normalizeLocale } from "./config";

export const PUBLIC_LOCALE_COOKIE = "zoe_public_lang";
import de from "./locales/de";
import en from "./locales/en";
import fr from "./locales/fr";
import tr from "./locales/tr";
import pt from "./locales/pt";
import ar from "./locales/ar";

export type Dictionary = typeof de;

const DICTIONARIES: Record<Locale, Dictionary> = {
  de, en, fr, tr, pt, ar,
};

const DE_DICT: Dictionary = de;

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DE_DICT;
}

// Lookup mit Fallback-Kaskade
export function t(dict: Dictionary, path: string): string {
  const value = resolvePath(dict, path);
  if (typeof value === "string" && value.length > 0) return value;
  const fallback = resolvePath(DE_DICT, path);
  if (typeof fallback === "string" && fallback.length > 0) return fallback;
  return path;
}

function resolvePath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

// Server-side Locale-Reader: liest aus auth-session + profiles.language.
// React.cache() dedupliziert Aufrufe innerhalb desselben Request-Lifecycles,
// d.h. mehrere Komponenten die getUserLocale() unabhaengig aufrufen,
// teilen sich genau einen Supabase-Roundtrip pro Render.
export const getUserLocale = cache(async (): Promise<Locale> => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_LOCALE;
    const { data: profile } = await supabase
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .maybeSingle();
    return normalizeLocale(profile?.language);
  } catch {
    return DEFAULT_LOCALE;
  }
});

// Convenience: lade Locale + Dict + curry'd t() in einem Schritt.
// Ebenfalls per React.cache() dedupliziert.
// USAGE:
//   const { locale, t } = await loadLocale();
//   <h1>{t("nav.dashboard")}</h1>
export const loadLocale = cache(async (): Promise<{
  locale: Locale;
  dict: Dictionary;
  t: (path: string) => string;
}> => {
  const locale = await getUserLocale();
  const dict = getDictionary(locale);
  return { locale, dict, t: (path: string) => t(dict, path) };
});

// Public-Locale-Reader fuer NICHT-eingeloggte Besucher.
// Fallback-Kaskade:
//   1) Cookie zoe_public_lang (manuell gesetzt via Language-Switch)
//   2) Accept-Language Header (vom Browser)
//   3) DEFAULT_LOCALE ("de")
//
// React.cache() dedupliziert pro Request.
export const getPublicLocale = cache(async (): Promise<Locale> => {
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get(PUBLIC_LOCALE_COOKIE)?.value;
    if (cookieVal && (LOCALES as readonly string[]).includes(cookieVal)) {
      return cookieVal as Locale;
    }
    // Accept-Language parsing: iteriere alle Praeferenzen in Order und nimm
    // die erste supported Locale (Codex-P3-Fix). Beispiel:
    //   "es-ES,fr;q=0.9,en;q=0.8" → "fr" (nicht "de")
    const hdrs = await headers();
    const al = hdrs.get("accept-language");
    if (al) {
      const prefs = al.split(",")
        .map((p) => p.split(";")[0].trim().split("-")[0].toLowerCase())
        .filter(Boolean);
      for (const p of prefs) {
        if ((LOCALES as readonly string[]).includes(p)) {
          return p as Locale;
        }
      }
    }
  } catch { /* silent */ }
  return DEFAULT_LOCALE;
});

// Effective-Locale: bevorzugt User-Profile (wenn eingeloggt), sonst Public.
// Genutzt im RootLayout fuer html lang + dir.
export const getEffectiveLocale = cache(async (): Promise<Locale> => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles").select("language").eq("id", user.id).maybeSingle();
      if (profile?.language) return normalizeLocale(profile.language);
    }
  } catch { /* silent */ }
  return getPublicLocale();
});

// loadPublicLocale: analog loadLocale, fuer Public-Pages (Homepage, /join etc.)
export const loadPublicLocale = cache(async (): Promise<{
  locale: Locale;
  dict: Dictionary;
  t: (path: string) => string;
}> => {
  const locale = await getPublicLocale();
  const dict = getDictionary(locale);
  return { locale, dict, t: (path: string) => t(dict, path) };
});

// Greeting-Helper basierend auf Stunde + Locale.
export function greetingKey(hour: number): string {
  if (hour < 5) return "greeting.night";
  if (hour < 11) return "greeting.morning";
  if (hour < 14) return "greeting.noon";
  if (hour < 18) return "greeting.afternoon";
  if (hour < 22) return "greeting.evening";
  return "greeting.night";
}
