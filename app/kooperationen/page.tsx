import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";

export const metadata: Metadata = {
  title: "Kooperationen",
  description:
    "Brand-Kooperationen mit ZOE Star Agency. Authentische Reichweite via redaktionell gepflegte Premium-Creator.",
};

export default function KooperationenPage() {
  return (
    <>
      <Header />
      <main className="bg-ink">
        <section className="container-luxe pt-32 md:pt-40 pb-20">
          <MotionReveal>
            <p className="eyebrow mb-5">Kooperationen</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h1 className="heading-display text-4xl md:text-7xl text-cream mb-6 leading-[0.95] max-w-4xl">
              Marken &amp; <span className="text-champagne">Creator</span> verbinden.
            </h1>
          </MotionReveal>
          <MotionReveal delay={0.2}>
            <p className="text-cream/70 text-lg md:text-2xl leading-relaxed max-w-3xl">
              Authentische Reichweite via redaktionell gepflegte Premium-Creator.
              Kein Scattergun-Influencer-Marketing, sondern kuratierte Partnerschaften.
            </p>
          </MotionReveal>
        </section>

        <section className="container-luxe pb-20">
          <MotionReveal>
            <p className="eyebrow mb-10">Formate</p>
          </MotionReveal>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Brand-Kampagnen",
                desc: "Mehrteilige Content-Kampagnen mit Creator-Roster. Strategie-Brief, Production, Review-Loop, Reporting.",
              },
              {
                title: "Produkt-Drops",
                desc: "Launch-Begleitung von Brand-Drops über mehrere Creator. Synchronisierte Posts, LIVE-Sessions, Stories.",
              },
              {
                title: "TikTok LIVE Aktionen",
                desc: "LIVE-Promotions, Battle-Sponsorings, Raffles und Tag-Aktionen. Direkter Engagement-Hebel.",
              },
              {
                title: "Editorial-Features",
                desc: "Long-Form-Content auf eigenen Kanälen — Brand-Storytelling für Marken mit Substanz.",
              },
              {
                title: "Affiliate &amp; Performance",
                desc: "Performance-Kampagnen mit klaren Konvertierungs-Metriken. Trackbar, sauber, faires Modell.",
              },
              {
                title: "Custom Briefs",
                desc: "Du hast eine ungewöhnliche Idee? Schreib uns. Wir bauen Konzepte auf Anfrage.",
              },
            ].map((c, i) => (
              <MotionReveal key={c.title} delay={i * 0.06}>
                <div className="border border-champagne/15 p-7 md:p-8 h-full">
                  <h3 className="font-display italic font-black text-xl md:text-2xl text-cream mb-3">
                    {c.title}
                  </h3>
                  <p className="text-cream/60 text-sm md:text-base leading-relaxed">{c.desc}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </section>

        <section className="container-luxe pb-20">
          <MotionReveal>
            <div className="border border-champagne/30 bg-champagne/5 p-8 md:p-12 max-w-4xl mx-auto">
              <p className="eyebrow mb-5 text-center">Anfrage</p>
              <h2 className="heading-display text-2xl md:text-4xl text-cream mb-5 leading-tight text-center">
                Reden wir über deine <span className="text-champagne">Kampagne</span>.
              </h2>
              <p className="text-cream/70 text-sm md:text-base mb-8 max-w-2xl mx-auto text-center leading-relaxed">
                Schreib uns kurz, was du planst — Briefing, Zeitraum, Budget-Range —
                und wir melden uns mit einem konkreten Vorschlag innerhalb von 2 Werktagen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact" className="btn-primary">
                  Kooperation anfragen
                </Link>
                <a href="mailto:info@zoe-star.de" className="btn-outline">
                  Direkt: info@zoe-star.de
                </a>
              </div>
            </div>
          </MotionReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
