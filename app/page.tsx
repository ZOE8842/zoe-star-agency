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

      {/* HERO — A3 Hybrid · Mutiger, ruhiger, dominanter */}
      <section className="relative min-h-[100vh] flex items-center bg-ink overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -right-[20vw] w-[80vw] h-[80vw] bg-champagne/[0.025] rounded-full blur-[160px]" />
        </div>

        <div className="container-luxe relative z-10 pt-44 pb-20 md:pt-40 md:pb-32 w-full">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* TYPO-SIDE — dominant */}
            <div className="lg:col-span-8">
              <p className="eyebrow mb-10 hero-rise" style={{ animationDelay: "0.1s" }}>
                Editorial Creator Platform
              </p>
              <h1 className="heading-display text-cream leading-[0.85] tracking-[-0.025em]">
                <span
                  className="block text-[88px] sm:text-[128px] md:text-[160px] lg:text-[200px] hero-rise"
                  style={{ animationDelay: "0.25s" }}
                >
                  ZOE
                </span>
                <span
                  className="block text-[26px] sm:text-[36px] md:text-[44px] lg:text-[52px] text-cream/70 hero-rise mt-3"
                  style={{ animationDelay: "0.45s" }}
                >
                  Star Agency
                </span>
              </h1>
              <p
                className="text-cream/55 text-lg md:text-2xl leading-relaxed max-w-xl mt-12 hero-rise font-light"
                style={{ animationDelay: "0.7s" }}
              >
                Eine Bühne für Premium-Talent.
              </p>
              <div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-12 hero-rise"
                style={{ animationDelay: "0.95s" }}
              >
                <a
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Als Creator bewerben
                </a>
                <Link href="/about" className="btn-outline">
                  Mehr erfahren
                </Link>
              </div>
            </div>

            {/* LOGO-SIDE — fast unmerklich atmend, Desktop-only */}
            <div className="lg:col-span-4 hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-square">
                <Logo variant="avatar" className="absolute inset-0 w-full h-full breathe" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-cream/25 text-[10px] uppercase tracking-[0.4em] hidden md:block">
          Scroll
        </div>
      </section>

      {/* I — BELIEVE · Manifest, editorial */}
      <section className="bg-ink py-40 md:py-64">
        <div className="container-luxe">
          <div className="max-w-5xl mx-auto">
            <MotionReveal>
              <p className="eyebrow mb-16 text-center">I · Believe</p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <p className="font-display italic text-cream text-[32px] sm:text-[48px] md:text-[64px] lg:text-[76px] leading-[1.05] text-center max-w-5xl mx-auto tracking-[-0.015em]">
                Wir glauben an Substanz statt Reichweite.<br />
                <span className="text-cream/60">An Tonalität statt Trend.</span><br />
                <span className="text-champagne">An Karriere statt Spike.</span>
              </p>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* II — ARE · warm, menschlich, Cream-Tausch */}
      <section className="bg-cream text-ink py-40 md:py-64">
        <div className="container-luxe">
          <div className="max-w-5xl mx-auto">
            <MotionReveal>
              <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50 mb-16 text-center">
                II · Are
              </p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <h2 className="font-display italic text-ink text-[36px] sm:text-[52px] md:text-[68px] leading-[1.05] text-center max-w-4xl mx-auto mb-24 tracking-[-0.015em]">
                Eine Boutique-Agentur.<br />Persönlich. Kuratiert.
              </h2>
            </MotionReveal>
            <div className="grid md:grid-cols-3 gap-16 md:gap-12">
              <MotionReveal>
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50 mb-5">Tonalität</p>
                <p className="text-ink/70 text-base leading-relaxed">
                  Editorial. Reduziert. Premium. Wir denken in Magazinen, nicht in Memes.
                </p>
              </MotionReveal>
              <MotionReveal delay={0.1}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50 mb-5">Roster</p>
                <p className="text-ink/70 text-base leading-relaxed">
                  Kein Massen-Roster. Wir nehmen nur Creator auf, hinter denen wir stehen.
                </p>
              </MotionReveal>
              <MotionReveal delay={0.2}>
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50 mb-5">Standort</p>
                <p className="text-ink/70 text-base leading-relaxed">
                  Süddeutschland. EU-Hosting, EU-Mailing, DSGVO-konform. Global ausgerichtet.
                </p>
              </MotionReveal>
            </div>
          </div>
        </div>
      </section>

      {/* III — BUILD · architectural precision */}
      <section className="bg-ink py-40 md:py-64">
        <div className="container-luxe">
          <div className="max-w-6xl mx-auto">
            <MotionReveal>
              <p className="eyebrow mb-16 text-center">III · Build</p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <h2 className="font-display italic text-cream text-[36px] sm:text-[52px] md:text-[68px] leading-[1.05] text-center max-w-3xl mx-auto mb-24 tracking-[-0.015em]">
                Vier Säulen.<br />Eine Marke.
              </h2>
            </MotionReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-cream/[0.06]">
              {[
                { num: "01", title: "Agency", desc: "Creator-Management & Talent-Repräsentation." },
                { num: "02", title: "Media", desc: "Brand-Kampagnen & Content-Produktion." },
                { num: "03", title: "Events", desc: "Live-Formate & Ranking-Shows." },
                { num: "04", title: "Studio", desc: "Original IP & Format-Entwicklung." },
              ].map((c, i) => (
                <MotionReveal key={c.num} delay={i * 0.06}>
                  <div className="bg-ink p-10 md:p-14 h-full transition-all duration-700 hover:bg-cream/[0.025]">
                    <p className="text-cream/35 text-[10px] uppercase tracking-[0.3em] mb-12">{c.num}</p>
                    <h3 className="font-display italic text-cream text-3xl md:text-4xl mb-6 leading-tight">
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

      {/* IV — JOIN · prestige, invitation */}
      <section className="bg-ink py-40 md:py-64">
        <div className="container-luxe">
          <div className="max-w-5xl mx-auto text-center">
            <MotionReveal>
              <p className="eyebrow mb-16">IV · Join</p>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <h2 className="font-display italic text-cream text-[44px] sm:text-[72px] md:text-[104px] lg:text-[128px] leading-[0.9] tracking-[-0.025em] mb-16">
                Bereit für die<br />
                <span className="text-champagne">nächste Stufe</span>?
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.2}>
              <p className="text-cream/55 text-base md:text-xl leading-relaxed max-w-xl mx-auto mb-16 font-light">
                Bewerbung läuft direkt über den offiziellen TikTok-Agency-Link.
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

          {/* Direct Contact — minimal, editorial */}
          <div className="mt-40 pt-16 border-t border-cream/[0.06] max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <p className="text-cream/35 text-[10px] uppercase tracking-[0.3em] mb-4">
                Direkter Kontakt
              </p>
              <a
                href="mailto:info@zoe-star.de"
                className="font-display italic text-cream text-3xl md:text-5xl link-underline hover:text-champagne transition-colors leading-none"
              >
                info@zoe-star.de
              </a>
            </div>
            <Link
              href="/contact"
              className="text-cream/60 text-[11px] uppercase tracking-[0.3em] link-underline hover:text-cream transition-colors"
            >
              Kontaktformular →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
