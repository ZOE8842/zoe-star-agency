"use client";

// Creator-Self Language-Picker. Analog AdminLanguageSelect, aber fuer
// das eigene Profil. Update via supabase-client + RLS "users update own
// profile" Policy. Bei Erfolg: location.reload() damit Server-rendered
// PortalNav + Greeting mit neuer Locale neu rendert.

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LOCALES, LOCALE_LABELS, type Locale, normalizeLocale } from "@/lib/i18n/config";

interface Props {
  profileId: string;
  currentLanguage: string | null;
  labelHint: string;
  savedLabel: string;
}

export function CreatorLanguageSelect({ profileId, currentLanguage, labelHint, savedLabel }: Props) {
  const [value, setValue] = useState<Locale>(normalizeLocale(currentLanguage));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: Locale) {
    if (next === value || busy) return;
    setError(null);
    setBusy(true);
    const prev = value;
    setValue(next);

    const supabase = createClient();
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ language: next })
      .eq("id", profileId);

    if (updErr) {
      setError(updErr.message);
      setValue(prev);
      setBusy(false);
      return;
    }
    // Vollreload damit Server-Komponenten neu mit der neuen Locale rendern.
    window.location.reload();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            disabled={busy}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              value === l
                ? "border-champagne bg-champagne/10 text-champagne"
                : "border-champagne/15 text-cream/60 hover:border-champagne/40 hover:text-cream"
            }`}
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
      </div>
      {labelHint && <p className="text-cream/40 text-xs mt-3">{labelHint}</p>}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      {busy && <p className="text-champagne/60 text-xs mt-2">…{savedLabel}</p>}
    </div>
  );
}
