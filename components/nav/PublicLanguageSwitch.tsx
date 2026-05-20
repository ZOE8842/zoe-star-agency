"use client";

// Public-Language-Switch fuer die oeffentliche Webseite (PublicNav).
// Setzt Cookie via POST /api/i18n/set-lang + reloadet die Seite.
// Initial-Locale wird vom Server als prop uebergeben.

import { useState, useRef, useEffect } from "react";
import { AVAILABLE_LOCALES, LOCALES, LOCALE_SHORT, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

interface Props {
  initialLocale: Locale;
}

// CDX-1: Solange nur eine Locale voll uebersetzt ist (AVAILABLE_LOCALES=['de']),
// rendern wir keinen Switcher. Setzt Cookie wuerde aktuell keinen UI-Effekt
// haben (LOCALE_LOCK in lib/i18n/index.ts).
const SWITCHER_ACTIVE = AVAILABLE_LOCALES.length > 1;

export function PublicLanguageSwitch({ initialLocale }: Props) {
  if (!SWITCHER_ACTIVE) return null;
  return <PublicLanguageSwitchInner initialLocale={initialLocale} />;
}

function PublicLanguageSwitchInner({ initialLocale }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState<Locale>(initialLocale);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  async function pick(next: Locale) {
    if (next === value || busy) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setOpen(false);
    try {
      const r = await fetch("/api/i18n/set-lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      if (!r.ok) {
        setBusy(false);
        return;
      }
      setValue(next);
      window.location.reload();
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
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
