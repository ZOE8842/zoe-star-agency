import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { LiveDot } from "@/components/LiveDot";
import { SectionNumber } from "@/components/SectionNumber";
import { loadPublicLocale } from "@/lib/i18n";

const APPLY_URL = "/join";

export const metadata: Metadata = {
  title: "Creator",
  description:
    "ZOE⭐ STAR AGENCY — TikTok LIVE Creator Management. Match-/Battle-Strategien, Ranking-Aufbau, Community-Wachstum, Brand-Deals.",
  alternates: { canonical: "/agency" },
};

const SERVICES = [
  { num: "01", title: "TikTok LIVE Strategien", desc: "Match- und Battle-Konzepte, Slot-Planung, Studio-Setup. Genau das, was auf der Plattform jetzt funktioniert." },
  { num: "02", title: "Ranking-Aufbau", desc: "Systematischer Aufbau in den TikTok-Rankings. Daten-getriebene LIVE-Zeiten, klare Routine, langfristiger Hebel." },
  { num: "03", title: "Community-Wachstum", desc: "Echte Audience-Aktivierung über Wochen und Monate. Kein One-Shot, sondern systematische Bindung." },
  { num: "04", title: "Match- & Battle-Coaching", desc: "Battle-Skills, Live-Reaktion, Engagement-Mechaniken, Match-Night-Begleitung." },
  { num: "05", title: "Event-Kampagnen", desc: "Multi-Creator-Aktionen, Live-Events, Ranking-Shows, koordinierte Drops." },
  { num: "06", title: "Manager-Zugang", desc: "Direkter Draht zu deinem Manager via Portal-Inbox. Keine anonyme Agentur." },
  { num: "07", title: "Brand-Deals", desc: "Wir bringen Marken zu dir — kuratiert, mit Brief, Vertrag und fairer Vergütung." },
  { num: "08", title: "Karriere-Entwicklung", desc: "Langfristige Roadmap statt kurzfristiger Trend-Hetzerei. Creator-Aufbau in Jahren, nicht Wochen." },
];

export default async function AgencyPage() {
  const { t } = await loadPublicLocale();
  return (
    <>
      <Header />
      <main className="bg-ink relative overflow-hidden">

        {/* HERO */}
        <section className="relative overflow-hidden border-b border-champagne/10">
          <div className="hero-glow-mesh" aria-hidden />
          <div className="absolute pointer-events-none select-none -bottom-[10%] -left-[4%] z-0">
            <SectionNumber number="01" rotation={-3} className="text-[260px] md:text-[480px] lg:text-[600px]" />
          </div>

          <div className="container-luxe relative z-10 pt-32 md:pt-40 pb-20 md:pb-28">
            <MotionReveal>
              <LiveDot label="TikTok Elite Agency Club" meta="Deutschland · 2026" className="mb-6 md:mb-8" />
            </MotionReveal>
            <MotionReveal delay={0.08}>
              <h1 className="leading-[0.92] tracking-[-0.025em] max-w-5xl">
                <span className="block mixed-type-line-1 text-cream/90 text-[44px] sm:text-[64px] md:text-[88px] lg:text-[108px]">TikTok LIVE</span>
                <span className="block mixed-type-line-2 text-champagne -mt-1 text-[52px] sm:text-[76px] md:text-[104px] lg:text-[124px]">Creator Management.</span>
              </h1>
            </MotionReveal>
            <MotionReveal delay={0.18}>
              <p className="text-cream/70 text-base md:text-xl leading-relaxed max-w-2xl mt-7 md:mt-10">
                Creator-Aufbau mit echtem LIVE-Fokus. Match-/Battle-Strategien, Ranking-Aufbau, Community-Wachstum, persönliche Betreuung.
              </p>
            </MotionReveal>
            <MotionReveal delay={0.28}>
              <div className="flex flex-col sm:flex-row gap-4 mt-10 md:mt-12">
                <Link href={APPLY_URL} className="btn-cta btn-shimmer">
                  Creator werden
                  <span className="btn-cta-arrow" aria-hidden>→</span>
                </Link>
                <Link href="/contact" className="btn-cta-secondary">
                  Fragen? Kontakt
                </Link>
              </div>
            </MotionReveal>
          </div>
        </section>

        {/* WAS WIR MACHEN */}
        <section className="relative bg-ink-mesh py-20 md:py-28 overflow-hidden border-b border-champagne/10">
          <div className="absolute pointer-events-none select-none -top-[6%] -right-[4%] z-0">
            <SectionNumber number="02" rotation={3} className="text-[260px] md:text-[480px] lg:text-[600px]" />
          </div>
          <div className="container-luxe relative z-10">
            <div className="grid md:grid-cols-12 gap-10 md:gap-14 mb-12 md:mb-16 items-end">
              <div className="md:col-span-7">
                <MotionReveal>
                  <p className="eyebrow mb-5">{t("agency_page.eyebrow_was_wir_machen")}</p>
                </MotionReveal>
                <MotionReveal delay={0.08}>
                  <h2 className="leading-[0.92] tracking-[-0.02em]">
                    <span className="block mixed-type-line-1 text-cream/90 text-[40px] sm:text-[60px] md:text-[80px] lg:text-[96px]">Acht Bereiche.</span>
                    <span className="block mixed-type-line-2 text-champagne -mt-1 text-[48px] sm:text-[72px] md:text-[96px] lg:text-[112px]">Ein Fokus.</span>
                  </h2>
                </MotionReveal>
              </div>
              <div className="md:col-span-5">
                <MotionReveal delay={0.15}>
                  <p className="text-cream/65 text-base md:text-lg leading-relaxed">
                    TikTok LIVE und Creator-Aufbau. Alles andere ist Variation davon.
                  </p>
                </MotionReveal>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-champagne/15">
              {SERVICES.map((c, i) => (
                <MotionReveal key={c.num} delay={i * 0.04}>
                  <div className="bg-ink p-7 md:p-8 h-full card-lift transition-all duration-500 hover:bg-champagne/[0.04]">
                    <p className="text-champagne text-[10px] uppercase tracking-[0.3em] mb-5">
                      {c.num}
                    </p>
                    <h3 className="font-display italic text-cream text-xl md:text-2xl mb-3 leading-tight">
                      {c.title}
                    </h3>
                    <p className="text-cream/55 text-sm leading-relaxed">{c.desc}</p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ROSTER-AUSWAHL */}
        <section className="container-luxe py-20 md:py-28">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-7">
              <MotionReveal>
                <p className="eyebrow mb-5">{t("agency_page.eyebrow_wir_waehlen")}</p>
              </MotionReveal>
              <MotionReveal delay={0.08}>
                <h2 className="leading-[0.92] tracking-[-0.02em] mb-6">
                  <span className="block mixed-type-line-1 text-cream/90 text-[36px] sm:text-[52px] md:text-[68px]">Kein Massen-Roster.</span>
                  <span className="block mixed-type-line-2 text-champagne -mt-1 text-[44px] sm:text-[60px] md:text-[80px]">Keine anonyme Betreuung.</span>
                </h2>
              </MotionReveal>
              <MotionReveal delay={0.18}>
                <p className="text-cream/65 text-base md:text-lg leading-relaxed max-w-xl">
                  Wir nehmen nur Creator auf, hinter denen wir stehen — und für die wir wirklich Wert schaffen können. Persönliche Begleitung, klare Strategie, faire Verträge.
                </p>
              </MotionReveal>
            </div>
            <div className="md:col-span-5 flex md:justify-end items-end">
              <MotionReveal delay={0.25}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={APPLY_URL} className="btn-cta btn-shimmer">
                    Creator werden
                    <span className="btn-cta-arrow" aria-hidden>→</span>
                  </Link>
                </div>
              </MotionReveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
