import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { LiveDot } from "@/components/LiveDot";
import { SectionNumber } from "@/components/SectionNumber";
import { Marquee } from "@/components/Marquee";
import { MailIcon, ArrowExternalIcon } from "@/components/SocialIcons";

export const metadata: Metadata = {
  title: "Kooperationen — TikTok LIVE Reichweite",
  description:
    "ZOE⭐ STAR AGENCY · TikTok Elite Agency Club Deutschland. Echte LIVE-Zahlen, aktive Creator, langfristige Brand-Kooperationen.",
};

// Echte Backstage-Stats — Stand April 2026, eigene Agency-Daten
// (KEINE Creator-spezifischen Daten, nur Aggregat-Werte)
const STATS = [
  { value: "53+", label: "Aktive Creator:innen", hint: "im Roster" },
  { value: "2.797+", label: "LIVE-Stunden", hint: "im April 2026" },
  { value: "1.930+", label: "Livestreams", hint: "im April 2026" },
  { value: "52 Std.", label: "Ø LIVE-Zeit", hint: "pro Creator/Monat" },
];

const SERVICES = [
  { title: "TikTok LIVE Kampagnen", desc: "Direkter Hebel über aktive LIVE-Creator. Tag-Aktionen, Sponsoring, Brand-Slots im Stream." },
  { title: "Community-Aufbau", desc: "Echte Audience-Mechaniken über Wochen und Monate. Kein One-Shot, sondern systematischer Aufbau." },
  { title: "Creator-Management", desc: "Persönliche Betreuung jedes Creators. Strategie, Briefing, Reporting." },
  { title: "LIVE Events", desc: "Match-Nights, Battle-Sponsorings, koordinierte Multi-Creator-Aktionen." },
  { title: "Brand-Integrationen", desc: "Native Einbindung von Marken in Creator-Content. Authentisch, nicht aufgesetzt." },
  { title: "Langfristige Kooperationen", desc: "3-, 6- oder 12-Monats-Setups. Kontinuität schlägt Einzel-Aktion." },
];

const SECTORS = [
  "Brands", "Apps", "Livestream-Produkte", "Gaming",
  "Beauty", "Lifestyle", "Fashion", "Entertainment",
];

export default function KooperationenPage() {
  return (
    <>
      <Header />

      <main className="bg-ink relative overflow-hidden">

        {/* ============================================================
            01 · HERO — Datenbasiert, kein Logo-Spam
            ============================================================ */}
        <section className="relative min-h-[88vh] flex flex-col justify-end overflow-hidden border-b border-champagne/10">
          <div className="hero-glow-mesh" aria-hidden />

          <div className="absolute pointer-events-none select-none -bottom-[12%] -right-[4%] z-0">
            <SectionNumber number="01" rotation={3} className="text-[280px] md:text-[600px] lg:text-[760px]" />
          </div>

          <div className="container-luxe relative z-10 w-full pt-32 pb-20 md:pt-40 md:pb-24">
            <div className="hero-rise" style={{ animationDelay: "0.05s" }}>
              <LiveDot label="TikTok Elite Agency Club" meta="Deutschland · 2026" />
            </div>

            <h1 className="mt-6 md:mt-8 leading-[0.92] tracking-[-0.025em] max-w-5xl">
              <span
                className="block hero-rise mixed-type-line-1 text-cream/90 text-[44px] sm:text-[64px] md:text-[88px] lg:text-[108px]"
                style={{ animationDelay: "0.2s" }}
              >
                TikTok LIVE Reichweite
              </span>
              <span
                className="block hero-rise mixed-type-line-2 text-champagne -mt-1 text-[52px] sm:text-[72px] md:text-[100px] lg:text-[120px]"
                style={{ animationDelay: "0.35s" }}
              >
                mit echten Creator:innen.
              </span>
            </h1>

            <p
              className="hero-rise text-cream/70 text-base md:text-xl leading-relaxed mt-7 md:mt-10 max-w-2xl"
              style={{ animationDelay: "0.55s" }}
            >
              ZOE⭐ STAR AGENCY ist Teil des <span className="text-champagne">TikTok Elite Agency Club Deutschland</span> mit Fokus auf LIVE Creator, Community-Aufbau und langfristige Aktivität.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 mt-10 md:mt-12 hero-rise"
              style={{ animationDelay: "0.75s" }}
            >
              <a href="mailto:info@zoe-star.de?subject=Kooperationsanfrage" className="btn-cta btn-shimmer">
                Kooperation anfragen
                <span className="btn-cta-arrow" aria-hidden>→</span>
              </a>
              <a href="#zahlen" className="btn-cta-secondary">
                Zahlen ansehen
              </a>
            </div>
          </div>

          {/* Hero-Bottom Marquee mit Stats-Teasern */}
          <div className="relative z-10 border-t border-champagne/15 py-4 bg-ink/70 backdrop-blur-sm">
            <Marquee
              items={[
                <span key="a" className="font-display italic text-cream/85 text-lg md:text-2xl">53+ aktive Creator:innen</span>,
                <span key="b" className="text-champagne text-[11px] uppercase tracking-[0.32em]">2.797+ LIVE-Stunden / Monat</span>,
                <span key="c" className="font-display italic text-cream/85 text-lg md:text-2xl">1.930+ Livestreams im April</span>,
                <span key="d" className="text-champagne text-[11px] uppercase tracking-[0.32em]">52 Std. Ø LIVE-Zeit</span>,
                <span key="e" className="font-display italic text-cream/85 text-lg md:text-2xl">TikTok Elite Agency Club</span>,
                <span key="f" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Deutschland · Aktiv</span>,
              ]}
              separatorStyle="dot"
            />
          </div>
        </section>

        {/* ============================================================
            02 · ZAHLEN — Das Herzstück. Echte Backstage-Daten.
            ============================================================ */}
        <section id="zahlen" className="relative bg-ink-mesh py-20 md:py-32 overflow-hidden border-b border-champagne/10">
          <div className="absolute pointer-events-none select-none -top-[8%] -left-[4%] z-0">
            <SectionNumber number="02" rotation={-3} className="text-[280px] md:text-[560px] lg:text-[700px]" />
          </div>

          <div className="container-luxe relative z-10">
            <div className="grid md:grid-cols-12 gap-10 md:gap-14 mb-14 md:mb-20 items-end">
              <div className="md:col-span-7">
                <MotionReveal>
                  <p className="eyebrow mb-5">Zahlen · April 2026</p>
                </MotionReveal>
                <MotionReveal delay={0.08}>
                  <h2 className="leading-[0.92] tracking-[-0.02em]">
                    <span className="block mixed-type-line-1 text-cream/90 text-[40px] sm:text-[60px] md:text-[80px] lg:text-[96px]">Aktivität,</span>
                    <span className="block mixed-type-line-2 text-champagne -mt-1 text-[48px] sm:text-[72px] md:text-[96px] lg:text-[112px]">die zählt.</span>
                  </h2>
                </MotionReveal>
              </div>
              <div className="md:col-span-5">
                <MotionReveal delay={0.15}>
                  <p className="text-cream/65 text-base md:text-lg leading-relaxed">
                    Nicht nur Headcount oder Follower-Zahlen — sondern reale LIVE-Stunden, echte Streams und kontinuierliche Aktivität. Stand April 2026, direkt aus unserem Backstage.
                  </p>
                </MotionReveal>
              </div>
            </div>

            {/* Stat-Cards groß */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-champagne/15">
              {STATS.map((s, i) => (
                <MotionReveal key={s.label} delay={i * 0.06}>
                  <div className="bg-ink p-7 md:p-10 h-full card-lift transition-all duration-500 hover:bg-champagne/[0.04]">
                    <p className="font-display italic font-black text-champagne text-5xl md:text-6xl lg:text-7xl leading-none mb-5 md:mb-6 tracking-[-0.02em]">
                      {s.value}
                    </p>
                    <p className="text-cream text-base md:text-lg font-medium leading-tight mb-2">
                      {s.label}
                    </p>
                    <p className="text-cream/45 text-xs md:text-sm leading-tight">
                      {s.hint}
                    </p>
                  </div>
                </MotionReveal>
              ))}
            </div>

            <MotionReveal delay={0.4}>
              <p className="text-cream/40 text-xs md:text-sm mt-8 max-w-2xl italic">
                Aggregate Werte. Keine Creator-spezifischen Daten. Genaue Reporting-Daten pro Kampagne auf Anfrage.
              </p>
            </MotionReveal>
          </div>
        </section>

        {/* ============================================================
            03 · WAS WIR MACHEN — klare Service-Liste
            ============================================================ */}
        <section className="relative bg-ink py-20 md:py-32 overflow-hidden border-b border-champagne/10">
          <div className="absolute pointer-events-none select-none -bottom-[8%] -right-[4%] z-0">
            <SectionNumber number="03" rotation={2} className="text-[280px] md:text-[560px] lg:text-[700px]" />
          </div>

          <div className="container-luxe relative z-10">
            <div className="grid md:grid-cols-12 gap-10 md:gap-14 mb-12 md:mb-16 items-end">
              <div className="md:col-span-7">
                <MotionReveal>
                  <p className="eyebrow mb-5">Was wir machen</p>
                </MotionReveal>
                <MotionReveal delay={0.08}>
                  <h2 className="leading-[0.92] tracking-[-0.02em]">
                    <span className="block mixed-type-line-1 text-cream/90 text-[40px] sm:text-[60px] md:text-[80px] lg:text-[96px]">Sechs Bereiche.</span>
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-champagne/15">
              {SERVICES.map((c, i) => (
                <MotionReveal key={c.title} delay={i * 0.05}>
                  <div className="bg-ink p-7 md:p-9 h-full card-lift transition-all duration-500 hover:bg-champagne/[0.04]">
                    <p className="text-champagne text-[10px] uppercase tracking-[0.3em] mb-5">
                      {String(i + 1).padStart(2, "0")}
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

        {/* ============================================================
            04 · FÜR WEN — Sektoren als Tag-Liste
            ============================================================ */}
        <section className="relative bg-cream-warm text-ink py-20 md:py-28 overflow-hidden border-b border-ink/10">
          <div className="absolute pointer-events-none select-none -top-[6%] -right-[2%] z-0">
            <SectionNumber number="04" rotation={3} variant="cream" className="text-[260px] md:text-[480px] lg:text-[600px]" />
          </div>

          <div className="container-luxe relative z-10">
            <div className="grid md:grid-cols-12 gap-10 md:gap-14 mb-10 md:mb-14 items-end">
              <div className="md:col-span-7">
                <MotionReveal>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-ink/55 mb-5">Für wen</p>
                </MotionReveal>
                <MotionReveal delay={0.08}>
                  <h2 className="font-display italic text-ink text-[40px] sm:text-[60px] md:text-[80px] lg:text-[96px] leading-[0.95] tracking-[-0.02em]">
                    Brands, die <span className="text-ink/65">Aktivität</span> wollen.
                  </h2>
                </MotionReveal>
              </div>
              <div className="md:col-span-5 md:pt-12">
                <MotionReveal delay={0.15}>
                  <p className="text-ink/65 text-base md:text-lg leading-relaxed">
                    Wir arbeiten mit Marken und Produkten, deren Zielgruppe auf TikTok aktiv ist und Community-Aktionen sieht.
                  </p>
                </MotionReveal>
              </div>
            </div>

            <MotionReveal delay={0.2}>
              <div className="flex flex-wrap gap-2.5">
                {SECTORS.map((s) => (
                  <span
                    key={s}
                    className="inline-block px-4 py-2.5 border border-ink/25 text-ink text-sm md:text-base font-medium hover:border-ink hover:bg-ink/5 transition-colors"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </MotionReveal>
          </div>
        </section>

        {/* ============================================================
            05 · KONTAKT — kurz, modern, schnell
            ============================================================ */}
        <section className="relative bg-ink py-24 md:py-36 overflow-hidden">
          <div className="hero-glow-mesh" aria-hidden />
          <div className="absolute pointer-events-none select-none -bottom-[12%] -left-[4%] z-0">
            <SectionNumber number="05" rotation={-3} className="text-[300px] md:text-[560px] lg:text-[700px]" />
          </div>

          <div className="container-luxe relative z-10">
            <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-end">
              <div className="md:col-span-8">
                <MotionReveal>
                  <p className="eyebrow mb-5">Kontakt</p>
                </MotionReveal>
                <MotionReveal delay={0.08}>
                  <h2 className="leading-[0.92] tracking-[-0.02em]">
                    <span className="block mixed-type-line-1 text-cream/90 text-[44px] sm:text-[64px] md:text-[88px] lg:text-[108px]">Direkter Draht</span>
                    <span className="block mixed-type-line-2 text-champagne -mt-1 text-[52px] sm:text-[80px] md:text-[108px] lg:text-[128px]">zur Agency.</span>
                  </h2>
                </MotionReveal>
                <MotionReveal delay={0.18}>
                  <p className="text-cream/65 text-base md:text-lg mt-7 max-w-xl leading-relaxed">
                    Für genaue Zahlen, Kampagnen oder Creator-Anfragen — direkt per Mail oder Formular.
                  </p>
                </MotionReveal>
                <MotionReveal delay={0.25}>
                  <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-10">
                    <a
                      href="mailto:info@zoe-star.de?subject=Kooperationsanfrage"
                      className="btn-cta btn-shimmer"
                    >
                      Anfrage per Mail
                      <span className="btn-cta-arrow" aria-hidden>→</span>
                    </a>
                    <Link href="/contact" className="btn-cta-secondary">
                      Zum Kontaktformular
                    </Link>
                  </div>
                </MotionReveal>
              </div>
              <div className="md:col-span-4">
                <MotionReveal delay={0.3}>
                  <div className="border-l border-champagne/30 pl-5">
                    <p className="eyebrow mb-3">Reaktion</p>
                    <p className="font-display italic text-cream text-xl md:text-2xl leading-snug mb-2">
                      Innerhalb 48 Std.
                    </p>
                    <p className="text-cream/45 text-xs leading-relaxed">
                      Mit konkretem Vorschlag und Reporting-Sample auf Anfrage.
                    </p>
                    <a
                      href="mailto:info@zoe-star.de"
                      className="inline-flex items-center gap-2 mt-5 text-champagne text-sm hover:text-champagne-300 transition-colors"
                    >
                      <MailIcon className="w-4 h-4" />
                      info@zoe-star.de
                      <ArrowExternalIcon className="w-3 h-3" />
                    </a>
                  </div>
                </MotionReveal>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
