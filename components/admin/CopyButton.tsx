"use client";

import { useCallback, useState } from "react";

interface Props {
  /** Inhalt der in die Zwischenablage geht */
  text: string;
  /** Label vor dem Copy (default: "Kopieren") */
  label?: string;
}

/**
 * CopyButton · pure clipboard.writeText
 * - Tap kopiert
 * - "✓ Kopiert" Feedback für 2 Sek
 * - Fallback wenn clipboard nicht verfügbar: window.prompt zum manuellen Kopieren
 * - Kein Auto-Send, kein Tracking, kein Drittsystem
 */
export function CopyButton({ text, label = "Kopieren" }: Props) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback für ältere Browser / unsichere Kontexte
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Letzter Fallback: manuell anzeigen
      try { window.prompt("Zum Kopieren markieren (Cmd/Strg+C):", text); } catch {}
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Nachricht kopiert" : "Nachricht kopieren"}
      className={`inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] px-3 py-2 border transition-colors active:opacity-70 ${
        copied
          ? "border-emerald-400/50 text-emerald-300/90 bg-emerald-400/[0.05]"
          : "border-champagne/40 text-champagne hover:bg-champagne/[0.06]"
      }`}
    >
      <span aria-hidden>{copied ? "✓" : "⎘"}</span>
      <span>{copied ? "Kopiert" : label}</span>
    </button>
  );
}
