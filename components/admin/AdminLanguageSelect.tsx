"use client";

// Admin-only Sprach-Selector fuer einen Creator-Profile.
// Update via supabase-client direkt (RLS erlaubt admin-update auf profiles).
// Bei Erfolg: Router-Refresh, damit serverseitige Anzeige aktualisiert wird.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALES, LOCALE_LABELS, type Locale, normalizeLocale } from "@/lib/i18n/config";

interface Props {
  profileId: string;
  currentLanguage: string | null;
}

export function AdminLanguageSelect({ profileId, currentLanguage }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<Locale>(normalizeLocale(currentLanguage));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: Locale) {
    if (next === value || pending) return;
    setError(null);
    setValue(next);

    const supabase = createClient();
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ language: next })
      .eq("id", profileId);

    if (updErr) {
      setError(updErr.message);
      setValue(normalizeLocale(currentLanguage));
      return;
    }
    setSavedAt(Date.now());
    startTransition(() => router.refresh());
  }

  const isSaved = savedAt !== null && (Date.now() - savedAt) < 3000;

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
      {isSaved && <span className="text-champagne text-xs">Gespeichert.</span>}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );
}
