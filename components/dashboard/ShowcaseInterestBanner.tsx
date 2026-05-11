"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setInterestStatus, type InterestKind } from "@/lib/profile/interest";

interface Props {
  showcasePending: boolean;
  coopPending: boolean;
}

export function ShowcaseInterestBanner({ showcasePending, coopPending }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;
  if (!showcasePending && !coopPending) return null;

  function decline(kind: InterestKind) {
    setError(null);
    startTransition(async () => {
      const r = await setInterestStatus(kind, "declined");
      if (!r.ok) {
        setError(r.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setHidden(true);
    });
  }

  function declineBoth() {
    setError(null);
    startTransition(async () => {
      const a = await setInterestStatus("showcase", "declined");
      const b = await setInterestStatus("cooperation", "declined");
      if (!a.ok || !b.ok) {
        setError(a.error || b.error || "Speichern fehlgeschlagen.");
        return;
      }
      setHidden(true);
    });
  }

  return (
    <section className="border border-champagne/30 bg-champagne/[0.04] p-5 md:p-7 mb-8">
      <p className="eyebrow text-champagne mb-3">Dein oeffentliches Creator-Profil</p>
      <h2 className="font-display italic text-cream text-2xl md:text-3xl leading-tight mb-3">
        Noch <span className="text-champagne">nicht aktiviert</span>.
      </h2>
      <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-5 max-w-2xl">
        Mit deinem Showcase-Profil kannst du auf der ZOE-Webseite sichtbar werden. Marken,
        Partner und neue Zuschauer koennen dich besser entdecken. Wenn du Kooperationen
        erlaubst, laufen Anfragen nicht direkt an dich, sondern sauber ueber ZOE Star Agency.
      </p>

      <ul className="space-y-1.5 text-cream/65 text-sm leading-relaxed mb-6 max-w-2xl">
        <li>· Mehr Sichtbarkeit auf der ZOE-Webseite</li>
        <li>· Professioneller Creator-Auftritt</li>
        <li>· Kooperationen laufen ueber die Agency</li>
        <li>· Du entscheidest, ob du teilnehmen moechtest</li>
        <li>· Keine Pflicht und keine Nachteile, wenn du ablehnst</li>
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        {showcasePending && (
          <Link
            href="/portal/profile/showcase"
            className="btn-cta btn-shimmer"
          >
            Showcase einrichten
            <span className="btn-cta-arrow" aria-hidden>→</span>
          </Link>
        )}
        {coopPending && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const r = await setInterestStatus("cooperation", "accepted");
                if (!r.ok) setError(r.error ?? "Speichern fehlgeschlagen.");
              });
            }}
            className="btn-cta-secondary disabled:opacity-50"
          >
            Kooperationen erlauben
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (showcasePending && coopPending) declineBoth();
            else if (showcasePending) decline("showcase");
            else decline("cooperation");
          }}
          disabled={isPending}
          className="text-cream/45 hover:text-cream/75 text-[11px] uppercase tracking-[0.25em] underline-offset-4 hover:underline disabled:opacity-50"
        >
          Kein Interesse
        </button>
      </div>

      {error && (
        <p className="text-red-300/85 text-xs italic mt-4">{error}</p>
      )}

      <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-5 leading-relaxed">
        Spaeter aendern · Profil → Sichtbarkeit
      </p>
    </section>
  );
}
