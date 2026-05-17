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

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_LOCALE, type Locale, normalizeLocale } from "./config";
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

// Server-side Locale-Reader: liest aus auth-session + profiles.language
export async function getUserLocale(): Promise<Locale> {
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
}
