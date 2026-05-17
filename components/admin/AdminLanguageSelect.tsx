"use client";

// Admin-only Sprach-Selector fuer einen Creator-Profile.
// Update via supabase-client direkt (RLS erlaubt admin-update auf profiles).
// Bei Erfolg: window.location.reload() damit ALLE Server-Components mit
// neuer Locale neu rendern. router.refresh() war zu soft - manche
// Komponenten lasen weiterhin gecachte Werte (Asymmetrie zu
// CreatorLanguageSelect + QuickLanguageSwitch behoben).

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LOCALES, LOCALE_LABELS, type Locale, normalizeLocale } from "@/lib/i18n/config";

interface Props {
  profileId: string;
  currentLanguage: string | null;
}

export function AdminLanguageSelect({ profileId, currentLanguage }: Props) {
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState<Locale>(normalizeLocale(currentLanguage));
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: Locale) {
    if (next === value || pending) return;
    setError(null);
    setValue(next);
    setPending(true);

    const supabase = createClient();
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ language: next })
      .eq("id", profileId);

    if (updErr) {
      setError(updErr.message);
      setValue(normalizeLocale(currentLanguage));
      setPending(false);
      return;
    }
    // Vollreload damit Server-Components in neuer Locale rendern.
    window.location.reload();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          disabled={pending}
          className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            value === l
              ? "border-champagne bg-champagne/10 text-champagne"
              : "border-champagne/15 text-cream/55 hover:border-champagne/40 hover:text-cream"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}
