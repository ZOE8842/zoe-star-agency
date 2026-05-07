import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { Logo } from "@/components/Logo";
import { BrandRow } from "@/components/BrandRow";
import { Marquee } from "@/components/Marquee";
import { GlassCard } from "@/components/GlassCard";
import { LiveDot } from "@/components/LiveDot";

const APPLY_URL =
  "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756";

export default function HomePage() {
  return (
    <>
      <Header />

      {/* ============================================================
          HERO — VOLT · Premium Creator Energy
          ============================================================ */}
      <section className="relative min-h-screen flex items-center bg-ink overflow-hidden pb-24 md:pb-0">
        {/* Multi-Stop Glow-Mesh — drift 22s */}
        <div className="hero-glow-mesh" aria-hidden />

        {/* Z-Watermark dezent */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/zoe_monogram_v3.svg"
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none opacity-[0.045] hidden lg:block"
          style={{ top: "8%", right: "-12%", width: "78vh" }}
        />

        <div className="container-luxe relative z-10 pt-32 pb-32 md:pt-36 md:pb-40 w-full">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* LEFT — Typo + Tagline + CTA */}
            <div className="lg:col-span-7">
              <div className="hero-rise" style={{ animationDelay: "0.05s" }}>
                <LiveDot label="Live now" meta="Berlin · 2026" />
              </div>

              <h1 className="heading-display text-cream leading-[0.85] tracking-[-0.025em] mt-6 md:mt-8">
                <span
                  className="block text-[80px] sm:text-[128px] md:text-[152px] lg:text-[180px] xl:text-[200px] hero-rise"
                  style={{ animationDelay: "0.2s" }}
                >
                  ZOE
                </span>
                <span
                  className="block text-[22px] sm:text-[34px] md:text-[42px] lg:text-[48px] text-cream/65 hero-rise mt-2"
                  style={{ animationDelay: "0.4s" }}
                >
                  Star Agency
                </span>
              </h1>

              {/* Mixed-Type Tagline — Sans + Italic-Display Akzent */}
              <p
                className="text-cream text-2xl sm:text-3xl md:text-4xl lg:text-[40px] leading-[1.1] tracking-[-0.01em] mt-10 md:mt-12 max-w-2xl font-light hero-rise"
                style={{ animationDelay: "0.6s" }}
              >
                Premium Creator.{" "}
                <span className="font-display italic font-black text-champagne">Hand-picked.</span>
                <br />
                Built different.
              </p>

              <div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-10 md:mt-12 hero-rise"
                style={{ animationDelay: "0.85s" }}
              >
                <a
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta btn-shimmer"
                >
                  Creator werden
                  <span className="btn-cta-arrow" aria-hidden>→</span>
                </a>
                <Link href="/about" className="btn-cta-secondary">
                  Mehr erfahren
                </Link>
              </div>
            </div>

            {/* RIGHT — Glass-Card Stack mit Z-Avatar (Desktop only) */}
            <div className="lg:col-span-5 hidden lg:block relative">
              <div className="relative aspect-square w-full max-w-[440px] mx-auto">
                {/* Z-Avatar Hauptelement */}
                <div className="absolute inset-0 hero-rise" style={{ animationDelay: "0.5s" }}>
                  <Logo variant="avatar" className="w-full h-full breathe" />
                </div>

                {/* Floating Tag 1 — top-right (Wrapper für hero-rise, inner GlassCard hat rotate) */}
                <div className="absolute top-[8%] -right-[6%] hero-rise" style={{ animationDelay: "0.95s" }}>
                  <GlassCard variant="strong" className="px-4 py-3" style={{ transform: "rotate(2deg)" }}>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-cream/55 mb-1">Standort</p>
                    <p className="font-display italic text-champagne text-xl leading-none">Berlin</p>
                  </GlassCard>
                </div>

                {/* Floating Tag 2 — bottom-left */}
                <div className="absolute bottom-[10%] -left-[8%] hero-rise" style={{ animationDelay: "1.1s" }}>
                  <GlassCard variant="strong" className="px-4 py-3" style={{ transform: "rotate(-3deg)" }}>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-cream/55 mb-1">Modell</p>
                    <p className="font-display italic text-champagne text-xl leading-none">Boutique</p>
                  </GlassCard>
                </div>

                {/* Floating Tag 3 — middle-right */}
                <div className="absolute top-[48%] right-[-12%] hero-rise" style={{ animationDelay: "1.25s" }}>
                  <GlassCard variant="strong" className="px-4 py-3" style={{ transform: "rotate(1deg)" }}>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-cream/55 mb-1">Roster</p>
                    <p className="font-display italic text-champagne text-xl leading-none">Hand-picked</p>
                  </GlassCard>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee — Hero-Bottom-Linie, full-width */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-champagne/15 py-5 bg-ink/60 backdrop-blur-sm hero-rise" style={{ animationDelay: "1.4s" }}>
          <Marquee
            items={[
              <span key="a" className="font-display italic text-cream/85 text-xl md:text-2xl">Premium Creator House</span>,
              <span key="b" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Berlin · 2026</span>,
              <span key="c" className="font-display italic text-cream/85 text-xl md:text-2xl">Boutique Management</span>,
              <span key="d" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Hand-picked</span>,
              <span key="e" className="font-display italic text-cream/85 text-xl md:text-2xl">Beauty · Fashion · Lifestyle</span>,
              <span key="f" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Tech · Food · Travel</span>,
              <span key="g" className="font-display italic text-cream/85 text-xl md:text-2xl">Private Network</span>,
              <span key="h" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Phase 01</span>,
            ]}
            separatorStyle="dot"
          />
        </div>
      </section>

      {/* ============================================================
          TRUST — Glass-Cards · LiveDot · BrandRow
          ============================================================ */}
      <section className="bg-ink border-t border-champagne/10 relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201, 168, 106, 0.08), transparent 60%)",
          }}
        />

        <div className="container-luxe relative z-10 py-20 md:py-28">
          {/* Header */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-end mb-14 md:mb-16">
            <MotionReveal>
              <LiveDot label="Live now" meta="Berlin · 2026" className="mb-6" />
              <h2 className="heading-display text-cream text-4xl md:text-6xl leading-[1.0] tracking-[-0.02em]">
                Kein Netzwerk.{" "}
                <span className="text-champagne italic">Ein Haus.</span>
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <p className="text-cream/65 text-lg leading-relaxed max-w-md md:justify-self-end">
                Boutique-Management aus Berlin. Wir arbeiten mit ausgewählten Creator-Stimmen — persönlich, langfristig, exklusiv.
              </p>
            </MotionReveal>
          </div>

          {/* Glass-Card Stats — 4 cards */}
          <MotionReveal delay={0.15}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-14 md:mb-20">
              {[
                { label: "Standort", value: "Berlin", hint: "Europe · DE" },
                { label: "Year", value: "2026", hint: "Phase 01 · Live" },
                { label: "Modell", value: "Boutique", hint: "Hand-picked Roster" },
                { label: "Network", value: "Private", hint: "Invite-only Access" },
              ].map((s) => (
                <GlassCard key={s.label} variant="default" className="p-5 md:p-7">
                  <p className="text-cream/45 text-[10px] uppercase tracking-[0.28em] mb-3">{s.label}</p>
                  <p className="font-display italic text-champagne text-3xl md:text-4xl leading-none mb-2">{s.value}</p>
                  <p className="text-cream/45 text-xs leading-tight">{s.hint}</p>
                </GlassCard>
              ))}
            </div>
          </MotionReveal>

          {/* Brand-Sektoren */}
          <MotionReveal delay={0.25}>
            <BrandRow caption="Sektoren · Erste Kohorte" />
          </MotionReveal>
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

      {/* STICKY MOBILE-CTA — Apply-Bar nur Mobile */}
      <div className="sticky-cta-bar">
        <a
          href={APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-cta btn-shimmer w-full"
        >
          Creator werden
          <span className="btn-cta-arrow" aria-hidden>→</span>
        </a>
      </div>
    </>
  );
}
