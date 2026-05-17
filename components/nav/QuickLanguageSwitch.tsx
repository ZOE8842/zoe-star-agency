"use client";

// Kleiner Quick-Sprach-Switch im PortalNav.
// Toggle-Dropdown mit allen 6 Locales.
// Update via supabase + window.location.reload damit Server-Components
// in neuer Locale rendern.

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LOCALES,
  LOCALE_SHORT,
  LOCALE_LABELS,
  type Locale,
  normalizeLocale,
} from "@/lib/i18n/config";

interface Props {
  profileId: string;
  currentLanguage: string | null;
}

export function QuickLanguageSwitch({ profileId, currentLanguage }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<Locale>(normalizeLocale(currentLanguage));
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function pick(next: Locale) {
    if (next === value || busy) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setOpen(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ language: next })
      .eq("id", profileId);
    if (error) {
      setBusy(false);
      console.error("[QuickLanguageSwitch]", error.message);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        disabled={busy}
        aria-label={`Language: ${LOCALE_LABELS[value]}`}
        className="text-cream/55 hover:text-champagne text-[10px] uppercase tracking-[0.25em] px-2 py-2 inline-flex items-center min-h-[36px] transition-colors disabled:opacity-50"
      >
        {LOCALE_SHORT[value]}
        <span className="ml-1 text-champagne/60 text-[9px]">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[160px] bg-ink border border-champagne/20 shadow-xl z-50">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pick(l)}
              className={`w-full text-left px-4 py-2.5 text-xs hover:bg-champagne/5 transition-colors ${
                value === l ? "text-champagne" : "text-cream/70"
              }`}
            >
              <span className="inline-block w-6 text-cream/40 text-[10px]">{LOCALE_SHORT[l]}</span>
              <span>{LOCALE_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
