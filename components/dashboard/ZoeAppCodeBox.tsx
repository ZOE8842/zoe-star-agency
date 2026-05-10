"use client";

// ZoeAppCodeBox — Creator fordert einmaligen Verbindungscode an,
// gibt ihn in der ZOE App ein, /zoestart oder /zoecheck nutzen.

import { useEffect, useState } from "react";

type InitialCode = {
  code: string;
  expires_at: string;
} | null;

interface Props {
  initial: InitialCode;
  tiktokUsername: string;
}

function formatExpiry(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "abgelaufen";
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  if (h >= 1) return `gueltig noch ${h}h ${m}min`;
  return `gueltig noch ${m} min`;
}

export function ZoeAppCodeBox({ initial, tiktokUsername }: Props) {
  const [code, setCode] = useState<string | null>(initial?.code ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(initial?.expires_at ?? null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  // tick wird genutzt um formatExpiry neu zu rendern
  void tick;

  const requestCode = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const r = await fetch("/api/zoe-app/request-code", { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error || "Konnte keinen Code erzeugen.");
        return;
      }
      setCode(j.code);
      setExpiresAt(j.expires_at);
    } catch {
      setError("Netzwerk-Fehler.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <section className="mb-12 md:mb-16">
      <div className="border border-champagne/15 p-6 md:p-8">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <p className="eyebrow">ZOE App verbinden</p>
          <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
            @{tiktokUsername}
          </span>
        </div>

        <p className="font-display italic text-cream text-2xl md:text-3xl leading-snug mb-3">
          Dein <span className="text-champagne">Verbindungscode.</span>
        </p>
        <p className="text-cream/60 text-sm md:text-base leading-relaxed mb-6 max-w-[52ch]">
          Verbinde dein Creator-Profil mit der ZOE App — danach erreichst du
          per Bot direkt deine Profil-Analyse und LIVE-Performance-Checks.
        </p>

        {code ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={copy}
              aria-label="Code kopieren"
              className="group inline-flex items-baseline gap-3 border border-champagne/30 hover:border-champagne hover:bg-champagne/5 transition-colors px-5 py-3.5"
            >
              <span className="font-mono text-champagne text-2xl md:text-3xl tracking-[0.32em]">
                {code}
              </span>
              <span className="text-cream/45 text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne transition-colors">
                {copied ? "kopiert" : "kopieren"}
              </span>
            </button>

            <p className="text-cream/40 text-xs">
              {expiresAt ? formatExpiry(expiresAt) : ""}
            </p>

            <div className="pt-4 border-t border-champagne/10">
              <p className="eyebrow mb-2">So gehts</p>
              <ol className="space-y-1.5 text-cream/70 text-sm">
                <li>1. ZOE App im Telegram oeffnen</li>
                <li>2. Code <span className="font-mono text-champagne">{code}</span> eingeben</li>
                <li>3. <span className="font-mono">/zoestart</span> oder <span className="font-mono">/zoecheck</span> nutzen</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={requestCode}
              disabled={loading}
              className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] transition-colors disabled:opacity-50"
            >
              {loading ? "…" : "Neuen Code anfordern"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={requestCode}
            disabled={loading}
            className="btn-cta btn-shimmer disabled:opacity-50"
          >
            {loading ? "Wird erzeugt…" : "Code anfordern"}
            {!loading && <span className="btn-cta-arrow" aria-hidden>→</span>}
          </button>
        )}

        {error && (
          <p className="text-champagne/70 text-xs italic mt-4">{error}</p>
        )}
      </div>
    </section>
  );
}
