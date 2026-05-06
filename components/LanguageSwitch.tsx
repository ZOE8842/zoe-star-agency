"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, isLocaleAvailable, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/config";

const STORAGE_KEY = "zoe-locale";

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(DEFAULT_LOCALE);
  const [toast, setToast] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    if (stored && LOCALES.includes(stored)) setCurrent(stored);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectLocale(locale: Locale) {
    if (!isLocaleAvailable(locale)) {
      setToast(`${LOCALE_LABELS[locale]} — coming soon`);
      setTimeout(() => setToast(null), 2400);
      setOpen(false);
      return;
    }
    setCurrent(locale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale);
    }
    setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Sprache wählen"
        className="inline-flex items-center justify-center min-w-[40px] h-9 px-2 border border-champagne/30 hover:border-champagne text-champagne text-[10px] uppercase tracking-[0.2em] transition"
      >
        {LOCALE_SHORT[current]}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-ink border border-champagne/30 shadow-lg z-50">
          <ul className="py-1">
            {LOCALES.map((loc) => {
              const available = isLocaleAvailable(loc);
              const isActive = loc === current;
              return (
                <li key={loc}>
                  <button
                    type="button"
                    onClick={() => selectLocale(loc)}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] transition ${
                      isActive
                        ? "bg-champagne/10 text-champagne"
                        : available
                          ? "text-cream hover:bg-champagne/5 hover:text-champagne"
                          : "text-cream/40 cursor-not-allowed"
                    }`}
                  >
                    <span>{LOCALE_LABELS[loc]}</span>
                    <span className="text-champagne/60 text-[9px]">
                      {available ? LOCALE_SHORT[loc] : "soon"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink border border-champagne/40 px-5 py-3 text-cream text-sm shadow-xl z-[60]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
