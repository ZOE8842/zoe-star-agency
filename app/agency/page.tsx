import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";

const APPLY_URL =
  "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756";

export const metadata: Metadata = {
  title: "Agency",
  description:
    "ZOE Star Agency — Creator-Management auf höchstem Niveau. Strategie, Live-Wachstum, Brand-Identität und langfristige Karriere-Entwicklung.",
};

export default function AgencyPage() {
  return (
    <>
      <Header />
      <main className="bg-ink">
        <section className="container-luxe pt-32 md:pt-40 pb-20">
          <MotionReveal>
            <p className="eyebrow mb-5">Agency</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h1 className="heading-display text-4xl md:text-7xl text-cream mb-6 leading-[0.95] max-w-4xl">
              Premium Creator <span className="text-champagne">Management</span>.
            </h1>
          </MotionReveal>
          <MotionReveal delay={0.2}>
            <p className="text-cream/70 text-lg md:text-2xl leading-relaxed max-w-3xl">
              Wir betreuen ausgewählte Creator strategisch — vom Account-Audit
              bis zur langfristigen Brand-Entwicklung. Premium statt Masse.
            </p>
          </MotionReveal>
        </section>

        <section className="container-luxe pb-20">
          <MotionReveal>
            <p className="eyebrow mb-10">Was wir machen</p>
          </MotionReveal>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { title: "Account-Strategie", desc: "Tiefen-Audit deines Profils, Niche-Positionierung, Hook-Library, Content-Frequenz und Posting-Plan." },
              { title: "Live-Coaching", desc: "TikTok-LIVE auf Premium-Niveau: Ranking-Strategie, Battle-Skills, Slot-Planung, Studio-Setup." },
              { title: "Brand-Identität", desc: "Visual Direction, Tonalität, Stylesheet — damit dein Account konsistent wirkt." },
              { title: "Karriere-Entwicklung", desc: "Langfristige Roadmap statt kurzfristiger Trend-Hetzerei. Karriere statt Spike." },
              { title: "Manager-Zugang", desc: "Direkter Draht zu deinem Manager via Portal-Inbox. Keine Anonym-Agentur." },
              { title: "Brand-Deals", desc: "Wir bringen Marken zu dir — kuratiert, mit Brief, Vertrag und fairer Vergütung." },
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
          <div className="border-t border-champagne/10 pt-16 max-w-3xl mx-auto text-center">
            <p className="eyebrow mb-6">Roster</p>
            <h2 className="heading-display text-3xl md:text-5xl text-cream mb-6 leading-tight">
              Wir wählen <span className="text-champagne">bewusst</span>.
            </h2>
            <p className="text-cream/70 text-base md:text-lg leading-relaxed mb-10">
              Wir nehmen nur Creator auf, hinter denen wir stehen — und für die wir
              wirklich Wert schaffen können. Kein Massenroster, keine Karteileichen.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Bewerbung starten
              </a>
              <Link href="/contact" className="btn-outline">Fragen? Kontakt</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
