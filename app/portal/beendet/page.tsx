import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Zugang beendet",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Landeseite fuer Accounts mit status = 'inactive'. Der Account bleibt
// bestehen, das Portal ist zu. Bewusst freundlich formuliert: Leute kommen
// zurueck, und die Seite ist oft das Letzte, was sie von uns sehen.
export default function ZugangBeendetPage() {
  return (
    <>
      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="container-luxe relative z-10 min-h-screen flex flex-col items-center justify-center py-16 max-w-lg text-center">
        <Logo variant="avatar" className="h-20 mb-8" />

        <p className="eyebrow mb-3">Portal</p>
        <h1 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-5">
          Dein Zugang ist <span className="text-champagne">pausiert</span>.
        </h1>

        <p className="text-cream/65 text-base leading-relaxed mb-4">
          Dein Account ist aktuell nicht mehr für das Creator Portal
          freigeschaltet. Deine Daten bleiben gespeichert, es ist nichts
          verloren.
        </p>
        <p className="text-cream/55 text-sm leading-relaxed mb-10">
          Wenn du denkst, das ist ein Versehen, oder wenn du zurückkommen
          möchtest: schreib uns einfach. Wir schalten dich wieder frei.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <a
            href="mailto:info@zoe-star.de?subject=Portal-Zugang"
            className="inline-flex items-center justify-center min-h-11 px-5 bg-champagne text-ink text-xs uppercase tracking-[0.25em] hover:bg-champagne-300 transition-colors"
          >
            Kontakt aufnehmen
          </a>
          <Link
            href="/portal/logout"
            className="inline-flex items-center justify-center min-h-11 px-5 border border-champagne/30 text-champagne text-xs uppercase tracking-[0.25em] hover:border-champagne hover:bg-champagne/5 transition-colors"
          >
            Abmelden
          </Link>
        </div>

        <Link
          href="/"
          className="mt-10 inline-flex items-center min-h-11 px-3 text-cream/45 hover:text-champagne text-xs uppercase tracking-[0.25em] transition-colors"
        >
          ← Zur Startseite
        </Link>
      </main>
    </>
  );
}
