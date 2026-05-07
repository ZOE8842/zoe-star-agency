import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { Logo } from "@/components/Logo";

const APPLY_URL =
  "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756";

export default function HomePage() {
  return (
    <>
      <Header />

      {/* HERO — A3 Hybrid: Typo links · Logo atmend rechts */}
      <section className="relative min-h-[100vh] flex items-center bg-ink overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[60vw] h-[60vw] bg-champagne/[0.04] rounded-full blur-[120px]" />
        </div>

        <div className="container-luxe relative z-10 pt-36 pb-20 md:pt-40 md:pb-28 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* TYPO-SIDE */}
            <div className="lg:col-span-7">
              <p className="eyebrow mb-8 hero-rise" style={{ animationDelay: "0.05s" }}>
                Editorial Creator Platform
              </p>
              <h1 className="heading-display text-cream leading-[0.9] tracking-[-0.02em]">
                <span className="block text-[64px] sm:text-[88px] md:text-[120px] lg:text-[140px] hero-rise" style={{ animationDelay: "0.15s" }}>
                  ZOE
                </span>
                <span className="block text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] text-cream/80 hero-rise mt-2" style={{ animationDelay: "0.3s" }}>
                  Star Agency
                </span>
              </h1>
              <p
                className="text-cream/60 text-base md:text-xl leading-relaxed max-w-xl mt-10 hero-rise"
                style={{ animationDelay: "0.5s" }}
              >
                Eine Bühne für Premium-Talent. Wir bauen Marken, die bleiben —
                redaktionell, ruhig, mit Substanz.
              </p>
              <div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-10 hero-rise"
                style={{ animationDelay: "0.7s" }}
              >
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Als Creator bewerben
                </a>
                <Link href="/about" className="btn-outline">
                  Mehr erfahren
                </Link>
              </div>
            </div>

            {/* LOGO-SIDE: Z-Monogram atmend */}
            <div className="lg:col-span-5 hidden lg:flex items-center justify-center relative">
              <div className="relative w-full max-w-md aspect-square">
                <div className="absolute inset-0 bg-champagne/[0.02] rounded-full" />
                <Logo variant="avatar" className="absolute inset-0 w-full h-full breathe" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-cream/30 text-[10px] uppercase tracking-[0.4em] hidden md:block">
          Scroll
        </div>
      </section>

      {/* I — BELIEVE */}
      <section className="bg-ink py-32 md:py-48">
        <div className="container-luxe">
          <div className="max-w-5xl mx-auto">
            <MotionReveal>
              <p className="eyebrow mb-12 text-center">I · Believe</p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <p className="font-display italic text-cream text-[28px] sm:text-[40px] md:text-[56px] lg:text-[64px] leading-[1.1] text-center max-w-4xl mx-auto">
                Wir glauben an{" "}
                <span className="text-champagne">Substanz</span> statt Reichweite.
                <br />An <span className="text-champagne">Tonalität</span> statt Trend.
                <br />An <span className="text-champagne">Karriere</span> statt Spike.
              </p>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* II — ARE */}
      <section className="bg-cream text-ink py-32 md:py-48">
        <div className="container-luxe">
          <div className="max-w-5xl mx-auto">
            <MotionReveal>
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink/60 mb-12 text-center">
                II · Are
              </p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <h2 className="font-display italic text-ink text-[28px] sm:text-[40px] md:text-[56px] leading-[1.1] text-center max-w-4xl mx-auto mb-16">
                Eine Boutique-Agentur. Persönlich. Kuratiert.
              </h2>
            </MotionReveal>
            <div className="grid md:grid-cols-3 gap-12 md:gap-16 mt-20">
              <MotionReveal>
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50 mb-4">Tonalität</p>
                <p className="text-ink/70 leading-relaxed">
                  Editorial. Reduziert. Premium. Wir denken in Magazinen, nicht in Memes.
                </p>
              </MotionReveal>
              <MotionReveal delay={0.1}>
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50 mb-4">Roster</p>
                <p className="text-ink/70 leading-relaxed">
                  Kein Massen-Roster. Wir nehmen nur Creator auf, hinter denen wir stehen.
                </p>
              </MotionReveal>
              <MotionReveal delay={0.2}>
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50 mb-4">Standort</p>
                <p className="text-ink/70 leading-relaxed">
                  Süddeutschland. EU-Hosting, EU-Mailing, DSGVO-konform. Global ausgerichtet.
                </p>
              </MotionReveal>
            </div>
          </div>
        </div>
      </section>

      {/* III — BUILD */}
      <section className="bg-ink py-32 md:py-48">
        <div className="container-luxe">
          <div className="max-w-6xl mx-auto">
            <MotionReveal>
              <p className="eyebrow mb-12 text-center">III · Build</p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <h2 className="font-display italic text-cream text-[28px] sm:text-[40px] md:text-[56px] leading-[1.1] text-center max-w-3xl mx-auto mb-20">
                Vier Säulen. Eine Marke.
              </h2>
            </MotionReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-cream/[0.05]">
              {[
                { num: "01", title: "Agency", desc: "Creator-Management & Talent-Repräsentation. Strategie, Identität, Karriere." },
                { num: "02", title: "Media", desc: "Brand-Kampagnen & Content-Produktion. Editorial statt Influencer-Standard." },
                { num: "03", title: "Events", desc: "Live-Formate & Ranking-Shows. TikTok-LIVE auf Premium-Niveau." },
                { num: "04", title: "Studio", desc: "Original IP & Format-Entwicklung. Eigene Marken, eigene Welten." },
              ].map((c, i) => (
                <MotionReveal key={c.num} delay={i * 0.06}>
                  <div className="bg-ink p-8 md:p-10 h-full transition-all duration-500 hover:bg-cream/[0.02]">
                    <p className="text-cream/40 text-[10px] uppercase tracking-[0.3em] mb-8">{c.num}</p>
                    <h3 className="font-display italic text-cream text-3xl md:text-4xl mb-4 leading-tight">
                      {c.title}
                    </h3>
                    <p className="text-cream/55 text-sm md:text-base leading-relaxed">{c.desc}</p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IV — JOIN */}
      <section className="bg-ink py-32 md:py-48 border-t border-cream/[0.05]">
        <div className="container-luxe">
          <div className="max-w-4xl mx-auto text-center">
            <MotionReveal>
              <p className="eyebrow mb-12">IV · Join</p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <h2 className="font-display italic text-cream text-[36px] sm:text-[56px] md:text-[80px] leading-[0.95] mb-10">
                Bereit für die <span className="text-champagne">nächste Stufe</span>?
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.2}>
              <p className="text-cream/60 text-base md:text-xl leading-relaxed max-w-2xl mx-auto mb-16">
                Wir betreuen ausgewählte Creator persönlich. Bewerbung läuft direkt
                über den offiziellen TikTok-Agency-Link.
              </p>
            </MotionReveal>
            <MotionReveal delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Jetzt bewerben
                </a>
                <Link href="/contact" className="btn-outline">
                  Lieber persönlich? Kontakt
                </Link>
              </div>
            </MotionReveal>
          </div>

          <div className="mt-32 pt-12 border-t border-cream/[0.05] max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-cream/40 text-[10px] uppercase tracking-[0.3em] mb-3">
                Direkter Kontakt
              </p>
              <a
                href="mailto:info@zoe-star.de"
                className="font-display italic text-cream text-2xl md:text-3xl link-underline hover:text-champagne transition-colors"
              >
                info@zoe-star.de
              </a>
            </div>
            <Link href="/contact" className="text-champagne text-[11px] uppercase tracking-[0.3em] link-underline hover:text-champagne-300 transition-colors">
              Kontaktformular →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
