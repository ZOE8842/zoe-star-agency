import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { LiveDot } from "@/components/LiveDot";
import { SectionNumber } from "@/components/SectionNumber";
import { loadPublicLocale } from "@/lib/i18n";
import { getPublicAgencyStats, formatStat } from "@/lib/stats/public-stats";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "ZOE⭐ STAR AGENCY — Teil des TikTok Elite Agency Club Deutschland. Fokus auf TikTok LIVE, Creator-Aufbau und langfristige Entwicklung.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const { t } = await loadPublicLocale();
  const stats = await getPublicAgencyStats();
  return (
    <>
      <Header />
      <main className="bg-ink relative overflow-hidden">

        {/* HERO */}
        <section className="relative overflow-hidden border-b border-champagne/10">
          <div className="hero-glow-mesh" aria-hidden />
          <div className="absolute pointer-events-none select-none -bottom-[10%] -right-[4%] z-0">
            <SectionNumber number="01" rotation={3} className="text-[260px] md:text-[480px] lg:text-[600px]" />
          </div>

          <div className="container-luxe relative z-10 pt-32 md:pt-40 pb-20 md:pb-28">
            <MotionReveal>
              <LiveDot label="TikTok Elite Agency Club" meta="Deutschland · 2026" className="mb-6 md:mb-8" />
            </MotionReveal>
            <MotionReveal delay={0.08}>
              <h1 className="leading-[0.92] tracking-[-0.025em] max-w-5xl">
                <span className="block mixed-type-line-1 text-cream/90 text-[44px] sm:text-[64px] md:text-[88px] lg:text-[108px]">
                  TikTok LIVE
                </span>
                <span className="block mixed-type-line-2 text-champagne -mt-1 text-[52px] sm:text-[76px] md:text-[104px] lg:text-[124px]">
                  Creator Management.
                </span>
              </h1>
            </MotionReveal>
            <MotionReveal delay={0.18}>
              <p className="text-cream/70 text-base md:text-xl leading-relaxed max-w-2xl mt-7 md:mt-10">
                ZOE⭐ STAR AGENCY ist Teil des <span className="text-champagne">TikTok Elite Agency Club Deutschland</span> mit Fokus auf TikTok LIVE, Creator-Aufbau und langfristige Entwicklung.
              </p>
            </MotionReveal>
          </div>
        </section>

        {/* PRINZIP / VISION / APPROACH / STANDORT — 4 stripes statt cards */}
        <section className="relative py-20 md:py-28 overflow-hidden border-b border-champagne/10">
          <div className="absolute pointer-events-none select-none -top-[6%] -left-[4%] z-0">
            <SectionNumber number="02" rotation={-2} className="text-[260px] md:text-[480px] lg:text-[600px]" />
          </div>

          <div className="container-luxe relative z-10">
            <div className="grid md:grid-cols-12 gap-10 md:gap-14 mb-12 md:mb-16 items-end">
              <div className="md:col-span-7">
                <MotionReveal>
                  <p className="eyebrow mb-5">{t("about.eyebrow_was_uns_ausmacht")}</p>
                </MotionReveal>
                <MotionReveal delay={0.08}>
                  <h2 className="leading-[0.92] tracking-[-0.02em]">
                    <span className="block mixed-type-line-1 text-cream/90 text-[40px] sm:text-[60px] md:text-[80px] lg:text-[96px]">Vier Prinzipien.</span>
                    <span className="block mixed-type-line-2 text-champagne -mt-1 text-[48px] sm:text-[72px] md:text-[96px] lg:text-[112px]">Eine Agentur.</span>
                  </h2>
                </MotionReveal>
              </div>
            </div>

            <div className="border-t border-champagne/15">
              {[
                {
                  label: "Prinzip",
                  value: "Langfristiger Creator-Aufbau statt kurzfristiger Hypes.",
                  hint: "Wir denken in Jahren, nicht in Wochen.",
                },
                {
                  label: "Fokus",
                  value: "TikTok LIVE. Match-/Battle-Strategien. Community-Aufbau.",
                  hint: "Genau das, was auf der Plattform jetzt funktioniert.",
                },
                {
                  label: "Approach",
                  value: "Direkt. Persönlich. Langfristig.",
                  hint: "Direkter Draht zum Management. Keine anonyme Betreuung.",
                },
                {
                  label: "Standort",
                  value: "Deutschland.",
                  hint: "Persönliche Betreuung im deutschsprachigen Raum.",
                },
              ].map((s, i) => (
                <MotionReveal key={s.label} delay={i * 0.08}>
                  <div className="border-b border-champagne/15 py-7 md:py-9 grid md:grid-cols-12 gap-6 items-baseline">
                    <p className="md:col-span-3 eyebrow">{s.label}</p>
                    <p className="md:col-span-6 font-display italic text-cream text-2xl md:text-3xl leading-snug">{s.value}</p>
                    <p className="md:col-span-3 text-cream/55 text-sm md:text-base">{s.hint}</p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Stats — Erinnerung an aktive Realität */}
        <section className="relative bg-ink-mesh py-16 md:py-24 overflow-hidden border-b border-champagne/10">
          <div className="container-luxe">
            <MotionReveal>
              <p className="eyebrow mb-8 md:mb-10">{t("about.eyebrow_aktivitaet")}</p>
            </MotionReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-champagne/15">
              {[
                // aus creator_daily_metrics, letzter voller Monat — bis
                // 2026-08-06 standen hier April-Werte fest im Code.
                { value: formatStat(stats.activeCreators), label: "Aktive Creator:innen" },
                { value: formatStat(stats.liveHours), label: "LIVE-Std. / Monat" },
                { value: formatStat(stats.liveDays), label: `LIVE-Tage im ${stats.monthLabel.split(" ")[0]}` },
                { value: `${stats.avgHoursPerCreator} Std.`, label: "Ø LIVE-Zeit" },
              ].map((s) => (
                <div key={s.label} className="bg-ink p-6 md:p-8">
                  <p className="font-display italic font-black text-champagne text-3xl md:text-4xl lg:text-5xl leading-none mb-3 tracking-[-0.02em]">
                    {s.value}
                  </p>
                  <p className="text-cream/65 text-xs md:text-sm leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roster-Auswahl-Statement */}
        <section className="container-luxe py-20 md:py-28">
          <MotionReveal>
            <div className="grid md:grid-cols-12 gap-10">
              <div className="md:col-span-7">
                <p className="eyebrow mb-5">{t("about.eyebrow_wir_waehlen")}</p>
                <h2 className="leading-[0.95] tracking-[-0.02em] mb-6">
                  <span className="block mixed-type-line-1 text-cream/90 text-[36px] sm:text-[52px] md:text-[68px]">Kein Massen-Roster.</span>
                  <span className="block mixed-type-line-2 text-champagne -mt-1 text-[44px] sm:text-[60px] md:text-[80px]">Keine anonyme Betreuung.</span>
                </h2>
                <p className="text-cream/65 text-base md:text-lg leading-relaxed max-w-xl">
                  Wir nehmen nur Creator auf, hinter denen wir stehen. Persönliche Begleitung, klare Strategie, faire Verträge — und ein Portal, das wirklich funktioniert.
                </p>
              </div>
              <div className="md:col-span-5 flex md:justify-end items-end">
                <Link href="/contact" className="btn-cta btn-shimmer">
                  Kontakt aufnehmen
                  <span className="btn-cta-arrow" aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </MotionReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
