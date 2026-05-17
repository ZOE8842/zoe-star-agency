"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/config";

const COOKIE_NAME = "zoe_public_lang";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
}

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(DEFAULT_LOCALE);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Codex-P2-Fix: Initial-State aus Cookie ODER (falls Cookie fehlt) aus
    // dem html lang-Attribut, das RootLayout via getEffectiveLocale gesetzt
    // hat. Sonst wuerde der Switch "DE" zeigen waehrend Server eine andere
    // Locale rendert (Accept-Language-Header-Match).
    const stored = readCookie(COOKIE_NAME);
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      setCurrent(stored as Locale);
      return;
    }
    if (typeof document !== "undefined") {
      const htmlLang = document.documentElement.getAttribute("lang");
      if (htmlLang && (LOCALES as readonly string[]).includes(htmlLang)) {
        setCurrent(htmlLang as Locale);
      }
    }
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

  async function selectLocale(locale: Locale) {
    if (locale === current || busy) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setOpen(false);
    try {
      const r = await fetch("/api/i18n/set-lang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!r.ok) { setBusy(false); return; }
      setCurrent(locale);
      window.location.reload();
    } catch { setBusy(false); }
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
              const isActive = loc === current;
              return (
                <li key={loc}>
                  <button
                    type="button"
                    onClick={() => selectLocale(loc)}
                    disabled={busy}
                    className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] transition disabled:opacity-50 ${
                      isActive
                        ? "bg-champagne/10 text-champagne"
                        : "text-cream hover:bg-champagne/5 hover:text-champagne"
                    }`}
                  >
                    <span>{LOCALE_LABELS[loc]}</span>
                    <span className="text-champagne/60 text-[9px]">{LOCALE_SHORT[loc]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
