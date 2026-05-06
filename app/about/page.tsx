import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "ZOE Star Agency — eine Boutique-Agentur für Premium-Creator. Wir bauen langfristige Marken statt kurzfristiger Trends.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-ink">
        <section className="container-luxe pt-32 md:pt-40 pb-20">
          <MotionReveal>
            <p className="eyebrow mb-5">Über uns</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h1 className="heading-display text-4xl md:text-7xl text-cream mb-6 leading-[0.95] max-w-4xl">
              Eine Bühne für <span className="text-champagne">Premium-Talent</span>.
            </h1>
          </MotionReveal>
          <MotionReveal delay={0.2}>
            <p className="text-cream/70 text-lg md:text-2xl leading-relaxed max-w-3xl">
              ZOE Star Agency ist eine Boutique-Agentur. Wir betreuen ausgewählte
              Creator persönlich, statt einen anonymen Massen-Roster zu führen.
            </p>
          </MotionReveal>
        </section>

        <section className="container-luxe pb-20">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl">
            <MotionReveal>
              <div>
                <p className="eyebrow mb-4">Vision</p>
                <h2 className="font-display italic text-2xl md:text-3xl text-cream mb-4 leading-tight">
                  Karriere statt Trend.
                </h2>
                <p className="text-cream/70 text-base leading-relaxed">
                  TikTok ist mehr als der nächste Hit. Wir denken in Jahren, nicht in
                  Wochen. Unsere Creator entwickeln Marken, die auch nach dem
                  nächsten Algorithmus-Update noch tragen.
                </p>
              </div>
            </MotionReveal>

            <MotionReveal delay={0.1}>
              <div>
                <p className="eyebrow mb-4">Approach</p>
                <h2 className="font-display italic text-2xl md:text-3xl text-cream mb-4 leading-tight">
                  Redaktionell &amp; persönlich.
                </h2>
                <p className="text-cream/70 text-base leading-relaxed">
                  Premium-Creator brauchen Premium-Betreuung. Direkter Draht zum
                  Manager, klare Strategie, faire Verträge — und ein Portal,
                  das wirklich funktioniert.
                </p>
              </div>
            </MotionReveal>

            <MotionReveal delay={0.2}>
              <div>
                <p className="eyebrow mb-4">Brand</p>
                <h2 className="font-display italic text-2xl md:text-3xl text-cream mb-4 leading-tight">
                  Schwarz · Champagne · Cream.
                </h2>
                <p className="text-cream/70 text-base leading-relaxed">
                  Unsere Brand-Identität ist editorial. Reduzierte Farb-Palette.
                  Geometrische Klarheit. Wir bauen Marken, die sich anfühlen wie
                  ein Magazin-Cover, nicht wie ein TikTok-Filter.
                </p>
              </div>
            </MotionReveal>

            <MotionReveal delay={0.3}>
              <div>
                <p className="eyebrow mb-4">Standort</p>
                <h2 className="font-display italic text-2xl md:text-3xl text-cream mb-4 leading-tight">
                  Deutschland · Global.
                </h2>
                <p className="text-cream/70 text-base leading-relaxed">
                  Hauptsitz: Süddeutschland. Wir arbeiten DSGVO-konform, mit
                  EU-Hosting und EU-Mailing. Creator-Roster international,
                  Sprachen aktuell DE/EN.
                </p>
              </div>
            </MotionReveal>
          </div>
        </section>

        <section className="container-luxe pb-20">
          <div className="border-t border-champagne/10 pt-16 max-w-3xl mx-auto text-center">
            <p className="eyebrow mb-6">Fragen?</p>
            <h2 className="heading-display text-3xl md:text-5xl text-cream mb-6 leading-tight">
              Lass uns <span className="text-champagne">reden</span>.
            </h2>
            <Link href="/contact" className="btn-outline">Kontakt aufnehmen</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
