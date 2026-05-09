import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { Logo } from "@/components/Logo";
import { BrandRow } from "@/components/BrandRow";
import { Marquee } from "@/components/Marquee";
import { GlassCard } from "@/components/GlassCard";
import { LiveDot } from "@/components/LiveDot";
import { SectionNumber } from "@/components/SectionNumber";
import { CreatorShowcaseCard, type CreatorShowcase } from "@/components/CreatorShowcaseCard";
import { FeaturedCreatorsStrip } from "@/components/FeaturedCreatorsStrip";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  TikTokIcon,
  InstagramIcon,
  MailIcon,
  ArrowExternalIcon,
} from "@/components/SocialIcons";

const VISUAL_CYCLE: NonNullable<CreatorShowcase["visual"]>[] = ["champagne", "warm", "cool", "ink"];

async function fetchFeaturedCreators(): Promise<CreatorShowcase[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("showcase_creators")
    .select("display_name, category, showcase_image, tiktok_url, instagram_url")
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .order("approved_at", { ascending: false });

  if (!data || data.length === 0) return [];

  return data.map((r, i): CreatorShowcase => {
    const platform: CreatorShowcase["platform"] =
      r.tiktok_url ? "tiktok" : r.instagram_url ? "instagram" : null;
    const href = r.tiktok_url || r.instagram_url || undefined;
    return {
      displayName: r.display_name,
      category: r.category ?? undefined,
      imageSrc: r.showcase_image ?? undefined,
      platform,
      href,
      visual: VISUAL_CYCLE[i % VISUAL_CYCLE.length],
    };
  });
}

// Fallback wenn DB leer: NUR Agency selbst, keine erfundenen Creator-Profile.
// Echte Creator erscheinen erst wenn Member-Bereich live ist und Admin
// echte Showcase-Bilder approved hat.
const FALLBACK_CARDS: CreatorShowcase[] = [
  {
    displayName: "ZOE Star Agency",
    category: "TikTok Elite Agency Club Deutschland",
    platform: "tiktok",
    href: "https://www.tiktok.com/@zoe.star.agency",
    visual: "champagne",
  },
];

const SOCIAL = {
  instagram: "https://www.instagram.com/starzagency_88",
  tiktokMain: "https://www.tiktok.com/@zoe.star.agency",
  tiktokManager: "https://www.tiktok.com/@zoelandoo",
  email: "info@zoe-star.de",
};

const APPLY_URL =
  "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756";

export default async function HomePage() {
  const fetched = await fetchFeaturedCreators();
  const featured = fetched.length > 0 ? fetched : FALLBACK_CARDS;
  // Hero-Stack zieht die ersten 3
  const hero = featured.slice(0, 3);
  return (
    <>
      <Header />

      {/* ============================================================
          HERO V4 — MEDIA-FIRST · Phone-Mockup dominiert
          ============================================================ */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-ink">
        {/* Glow-Mesh */}
        <div className="hero-glow-mesh" aria-hidden />

        {/* Section-Number "01" — atmospheric */}
        <div className="absolute pointer-events-none select-none -bottom-[12%] -left-[6%] md:-bottom-[18%] md:-left-[4%] z-0">
          <SectionNumber
            number="01"
            rotation={-4}
            className="text-[280px] md:text-[600px] lg:text-[760px]"
          />
        </div>

        <div className="container-luxe relative z-10 w-full pt-28 pb-12 md:pt-32 md:pb-12">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">

            {/* LEFT — Headline + CTA */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="hero-rise" style={{ animationDelay: "0.05s" }}>
                <LiveDot label="TikTok Elite Agency Club" meta="Deutschland · 2026" />
              </div>

              {/* Mixed-Type Headline — TikTok Elite Identity */}
              <h1 className="mt-6 md:mt-8 mb-4 leading-[0.92]">
                <span
                  className="block hero-rise mixed-type-line-1 text-cream/90 text-[52px] sm:text-[72px] md:text-[88px] lg:text-[108px]"
                  style={{ animationDelay: "0.2s" }}
                >
                  TikTok
                </span>
                <span
                  className="block hero-rise mixed-type-line-2 text-champagne -mt-1 md:-mt-2 text-[64px] sm:text-[88px] md:text-[112px] lg:text-[136px]"
                  style={{ animationDelay: "0.35s" }}
                >
                  Elite-Agentur.
                </span>
              </h1>

              <p
                className="hero-rise mixed-type-line-3 text-cream/75 text-lg md:text-2xl lg:text-3xl mt-4 md:mt-6 max-w-xl"
                style={{ animationDelay: "0.55s" }}
              >
                LIVE Creator. Persönlich betreut.{" "}
                <span className="font-display italic font-black text-champagne">Deutschland.</span>
              </p>

              <div
                className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-10 hero-rise"
                style={{ animationDelay: "0.75s" }}
              >
                <a
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta btn-shimmer"
                >
                  Bewerben
                  <span className="btn-cta-arrow" aria-hidden>→</span>
                </a>
              </div>

              <div className="flex flex-wrap gap-2 mt-6 hero-rise" style={{ animationDelay: "0.9s" }}>
                <a
                  href={SOCIAL.tiktokMain}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-flex items-center gap-2 px-3 py-2 border border-champagne/20 hover:border-champagne hover:bg-champagne/5 transition-all text-cream/75 hover:text-champagne text-xs"
                >
                  <TikTokIcon className="w-3.5 h-3.5" />
                  <span>TikTok</span>
                </a>
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center gap-2 px-3 py-2 border border-champagne/20 hover:border-champagne hover:bg-champagne/5 transition-all text-cream/75 hover:text-champagne text-xs"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
                <a
                  href={`mailto:${SOCIAL.email}`}
                  aria-label="Kontakt"
                  className="inline-flex items-center gap-2 px-3 py-2 border border-champagne/20 hover:border-champagne hover:bg-champagne/5 transition-all text-cream/75 hover:text-champagne text-xs"
                >
                  <MailIcon className="w-3.5 h-3.5" />
                  <span>Kontakt</span>
                </a>
              </div>
            </div>

            {/* RIGHT — Agency-Card + Elite-Badge (KEINE erfundenen Creator) */}
            <div className="lg:col-span-6 order-1 lg:order-2 relative">
              <div className="relative max-w-[300px] md:max-w-[360px] mx-auto">
                {hero[0] && (
                  <div className="hero-rise relative z-20" style={{ animationDelay: "0.4s" }}>
                    <CreatorShowcaseCard {...hero[0]} visual="champagne" />
                  </div>
                )}

                {/* Elite-Badge top-right floating */}
                <div
                  className="hidden md:block absolute -top-3 -right-6 z-30 hero-rise"
                  style={{ animationDelay: "0.7s", transform: "rotate(4deg)" }}
                >
                  <div className="glass-card-strong px-4 py-3 max-w-[180px]">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-champagne mb-1">Status</p>
                    <p className="font-display italic text-cream text-base leading-tight">
                      TikTok Elite Agency Club Deutschland
                    </p>
                  </div>
                </div>

                {/* LIVE-Focus Badge bottom-left floating */}
                <div
                  className="hidden md:block absolute -bottom-4 -left-8 z-30 hero-rise"
                  style={{ animationDelay: "0.85s", transform: "rotate(-3deg)" }}
                >
                  <div className="glass-card-strong px-4 py-3">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-champagne mb-1">Fokus</p>
                    <p className="font-display italic text-cream text-base leading-tight">
                      TikTok LIVE
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee — Hero-Bottom-Linie */}
        <div
          className="relative z-10 border-t border-champagne/15 py-4 bg-ink/70 backdrop-blur-sm hero-rise mt-auto"
          style={{ animationDelay: "1.0s" }}
        >
          <Marquee
            items={[
              <span key="a" className="font-display italic text-cream/85 text-lg md:text-2xl">TikTok Elite Agency Club</span>,
              <span key="b" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Deutschland · 2026</span>,
              <span key="c" className="font-display italic text-cream/85 text-lg md:text-2xl">LIVE Creator Management</span>,
              <span key="d" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Persönlich · Direkt</span>,
              <span key="e" className="font-display italic text-cream/85 text-lg md:text-2xl">Creator-Aufbau</span>,
              <span key="f" className="text-champagne text-[11px] uppercase tracking-[0.32em]">Edit. 01 · Aktiv</span>,
            ]}
            separatorStyle="dot"
          />
        </div>
      </section>

      {/* ============================================================
          QUICK-STATS — direkt nach Hero, echte Backstage-Daten.
          Verkauft sofort: hier passiert wirklich etwas.
          ============================================================ */}
      <section className="bg-ink border-t border-champagne/10 relative overflow-hidden">
        <div className="container-luxe relative z-10 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-champagne/15">
            {[
              { value: "53+", label: "Aktive Creator:innen" },
              { value: "2.797+", label: "LIVE-Std. / Monat" },
              { value: "1.930+", label: "Livestreams im April" },
              { value: "Elite", label: "TikTok Agency Club DE" },
            ].map((s) => (
              <div key={s.label} className="bg-ink p-6 md:p-8">
                <p className="font-display italic font-black text-champagne text-4xl md:text-5xl lg:text-6xl leading-none mb-3 md:mb-4 tracking-[-0.02em]">
                  {s.value}
                </p>
                <p className="text-cream/65 text-xs md:text-sm leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          02 · ROSTER — Creator Showcase (echte Bilder erst nach
          Member-Bereich-Launch; bis dahin reduziert + ehrlicher Stand)
          ============================================================ */}
      <section className="relative bg-ink-mesh py-20 md:py-28 overflow-hidden">
        <div className="absolute pointer-events-none select-none -top-[8%] -right-[4%] z-0">
          <SectionNumber
            number="02"
            rotation={3}
            className="text-[260px] md:text-[480px] lg:text-[600px]"
          />
        </div>

        <div className="relative z-10 container-luxe mb-10 md:mb-14">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p className="eyebrow mb-4">Roster · Phase 01</p>
              <h2 className="heading-display text-cream text-4xl md:text-6xl leading-[1.0] tracking-[-0.02em]">
                Unsere <span className="text-champagne italic">Creator.</span>
              </h2>
            </div>
            <a
              href={SOCIAL.tiktokMain}
              target="_blank"
              rel="noopener noreferrer"
              className="text-champagne text-[11px] uppercase tracking-[0.3em] hover:text-champagne-300 inline-flex items-center gap-2"
            >
              Auf TikTok folgen
              <ArrowExternalIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="relative z-10 container-luxe">
          {fetched.length > 0 ? (
            <FeaturedCreatorsStrip creators={featured} />
          ) : (
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="md:col-span-7">
                <p className="text-cream/65 text-lg md:text-xl leading-relaxed max-w-xl mb-6">
                  Unser Roster wird gerade aufgebaut. Sobald die ersten Creator approved sind, erscheinen sie hier mit Bild und TikTok-Link.
                </p>
                <p className="text-cream/45 text-sm leading-relaxed max-w-xl mb-8">
                  Du bist Creator und willst dabei sein? Bewirb dich direkt — wir schauen uns jede Bewerbung persönlich an.
                </p>
                <a
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta btn-shimmer"
                >
                  Bewerben
                  <span className="btn-cta-arrow" aria-hidden>→</span>
                </a>
              </div>
              <div className="md:col-span-5 md:max-w-[280px] md:ml-auto w-full">
                <CreatorShowcaseCard {...featured[0]} visual="champagne" />
              </div>
            </div>
          )}
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
              <LiveDot label="Elite Agency Club" meta="Deutschland · 2026" className="mb-6" />
              <h2 className="heading-display text-cream text-4xl md:text-6xl leading-[1.0] tracking-[-0.02em]">
                Deutschlands{" "}
                <span className="text-champagne italic">Elite Agency Club.</span>
              </h2>
            </MotionReveal>
            <MotionReveal delay={0.1}>
              <p className="text-cream/65 text-lg leading-relaxed max-w-md md:justify-self-end">
                Persönliches Creator-Management aus Deutschland. Fokus auf TikTok LIVE — langfristig, exklusiv, mit echtem Aufbau-Plan.
              </p>
            </MotionReveal>
          </div>

          {/* Glass-Card Stats — 4 cards */}
          <MotionReveal delay={0.15}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-14 md:mb-20">
              {[
                { label: "Standort", value: "Deutschland", hint: "Creator-Management" },
                { label: "Status", value: "Elite", hint: "TikTok Agency Club" },
                { label: "Fokus", value: "LIVE", hint: "Creator-Aufbau" },
                { label: "Netzwerk", value: "Privat", hint: "Nur per Einladung" },
              ].map((s) => (
                <GlassCard key={s.label} variant="default" className="p-5 md:p-7">
                  <p className="text-cream/45 text-[10px] uppercase tracking-[0.28em] mb-3">{s.label}</p>
                  <p className="font-display italic text-champagne text-3xl md:text-4xl leading-none mb-2">{s.value}</p>
                  <p className="text-cream/45 text-xs leading-tight">{s.hint}</p>
                </GlassCard>
              ))}
            </div>
          </MotionReveal>

          {/* Bereiche — TikTok-LIVE-spezifisch */}
          <MotionReveal delay={0.25}>
            <BrandRow
              caption="Was wir machen"
              items={[
                "TikTok LIVE",
                "Creator-Aufbau",
                "Community-Aufbau",
                "LIVE Battles",
                "LIVE Events",
                "TikTok Rankings",
              ]}
            />
          </MotionReveal>

          {/* PLATFORM-ROW — Display-Name dominant, Username klein */}
          <MotionReveal delay={0.35}>
            <div className="mt-14 md:mt-20 pt-10 md:pt-14 border-t border-champagne/10">
              <div className="flex items-center gap-4 mb-7 md:mb-8">
                <LiveDot label="Aktiv auf" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <a
                  href={SOCIAL.tiktokMain}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-card flex items-center gap-5 px-5 py-6 md:px-7 md:py-7 hover:border-champagne hover:bg-champagne/[0.04] transition-all duration-300 cursor-pointer"
                >
                  <span className="w-12 h-12 rounded-full bg-champagne/8 border border-champagne/30 flex items-center justify-center text-champagne shrink-0 group-hover:bg-champagne/15 transition-colors">
                    <TikTokIcon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-cream/45 text-[10px] uppercase tracking-[0.28em] mb-1">TikTok · Agency</p>
                    <p className="text-cream group-hover:text-champagne font-display italic text-xl md:text-2xl leading-tight transition-colors">
                      ZOE Star Agency
                    </p>
                    <p className="text-cream/35 text-[11px] mt-0.5 truncate">tiktok.com/@zoe.star.agency</p>
                  </div>
                  <ArrowExternalIcon className="w-4 h-4 text-cream/30 group-hover:text-champagne group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>

                <a
                  href={SOCIAL.tiktokManager}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-card flex items-center gap-5 px-5 py-6 md:px-7 md:py-7 hover:border-champagne hover:bg-champagne/[0.04] transition-all duration-300 cursor-pointer"
                >
                  <span className="w-12 h-12 rounded-full bg-champagne/8 border border-champagne/30 flex items-center justify-center text-champagne shrink-0 group-hover:bg-champagne/15 transition-colors">
                    <TikTokIcon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-cream/45 text-[10px] uppercase tracking-[0.28em] mb-1">TikTok · Management</p>
                    <p className="text-cream group-hover:text-champagne font-display italic text-xl md:text-2xl leading-tight transition-colors">
                      Nesip · ZOE⭐
                    </p>
                    <p className="text-cream/35 text-[11px] mt-0.5 truncate">tiktok.com/@zoelandoo</p>
                  </div>
                  <ArrowExternalIcon className="w-4 h-4 text-cream/30 group-hover:text-champagne group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>

                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-card flex items-center gap-5 px-5 py-6 md:px-7 md:py-7 hover:border-champagne hover:bg-champagne/[0.04] transition-all duration-300 cursor-pointer"
                >
                  <span className="w-12 h-12 rounded-full bg-champagne/8 border border-champagne/30 flex items-center justify-center text-champagne shrink-0 group-hover:bg-champagne/15 transition-colors">
                    <InstagramIcon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-cream/45 text-[10px] uppercase tracking-[0.28em] mb-1">Instagram</p>
                    <p className="text-cream group-hover:text-champagne font-display italic text-xl md:text-2xl leading-tight transition-colors">
                      ZOE⭐ Star Agency
                    </p>
                    <p className="text-cream/35 text-[11px] mt-0.5 truncate">instagram.com/starzagency_88</p>
                  </div>
                  <ArrowExternalIcon className="w-4 h-4 text-cream/30 group-hover:text-champagne group-hover:translate-x-0.5 transition-all shrink-0" />
                </a>
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* ============================================================
          03 · BELIEVE — asymmetrisches Manifest mit Section-Number
          ============================================================ */}
      <section className="relative bg-ink overflow-hidden py-24 md:py-36 border-t border-champagne/10">
        <div className="absolute pointer-events-none select-none -top-[8%] -left-[4%] z-0">
          <SectionNumber number="03" rotation={-2} className="text-[260px] md:text-[480px] lg:text-[600px]" />
        </div>
        <div className="container-luxe relative z-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-end">
            <div className="md:col-span-8">
              <MotionReveal>
                <p className="eyebrow mb-5">I · Believe</p>
              </MotionReveal>
              <MotionReveal delay={0.08}>
                <h2 className="leading-[0.92] tracking-[-0.025em]">
                  <span className="block mixed-type-line-1 text-cream/85 text-[44px] sm:text-[64px] md:text-[88px] lg:text-[108px]">Substanz</span>
                  <span className="block mixed-type-line-2 text-cream -mt-1 text-[52px] sm:text-[72px] md:text-[100px] lg:text-[124px]">statt Reichweite.</span>
                </h2>
              </MotionReveal>
              <MotionReveal delay={0.18}>
                <p className="text-cream/60 text-base md:text-lg mt-7 max-w-xl leading-relaxed">
                  Tonalität statt Trend.{" "}
                  <span className="font-display italic text-champagne">Karriere statt Spike.</span>
                </p>
              </MotionReveal>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <MotionReveal delay={0.25}>
                <div className="border-l border-champagne/30 pl-5 max-w-xs">
                  <p className="eyebrow mb-3">Unser Prinzip</p>
                  <p className="font-display italic text-cream text-xl md:text-2xl leading-snug">
                    Langfristiger Creator-Aufbau statt kurzfristiger Hypes.
                  </p>
                </div>
              </MotionReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          04 · ARE — Cream-Tausch, asymmetrisch mit Stat-Stripes
          ============================================================ */}
      <section className="relative bg-cream-warm text-ink overflow-hidden py-24 md:py-36">
        <div className="absolute pointer-events-none select-none -top-[6%] -right-[2%] z-0">
          <SectionNumber number="04" rotation={3} variant="cream" className="text-[260px] md:text-[480px] lg:text-[600px]" />
        </div>
        <div className="container-luxe relative z-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-14 mb-14 md:mb-16">
            <div className="md:col-span-5">
              <MotionReveal>
                <p className="text-[11px] uppercase tracking-[0.3em] text-ink/55 mb-5">II · Are</p>
              </MotionReveal>
              <MotionReveal delay={0.08}>
                <h2 className="leading-[0.95] tracking-[-0.02em] font-display italic text-ink text-[44px] sm:text-[60px] md:text-[80px]">
                  Elite.<br />
                  <span className="text-ink/70">Persönlich.</span>
                </h2>
              </MotionReveal>
            </div>
            <div className="md:col-span-7 md:pt-12">
              <MotionReveal delay={0.15}>
                <p className="text-ink/65 text-base md:text-lg leading-relaxed max-w-xl">
                  Wir nehmen nur Creator auf, hinter denen wir stehen. Fokus auf TikTok LIVE, persönlich im Umgang, langfristig im Aufbau.
                </p>
              </MotionReveal>
            </div>
          </div>

          {/* 3 horizontal stripes statt zentrierter 3-col-grid */}
          <div className="border-t border-ink/15">
            {[
              { label: "Fokus", value: "TikTok LIVE & Creator-Aufbau.", hint: "Das machen wir jeden Tag." },
              { label: "Roster", value: "Kein Massen-Management. Direkte Betreuung.", hint: "Statt anonymer Agentur." },
              { label: "Standort", value: "Deutschland.", hint: "Persönliche Betreuung im DACH-Raum." },
            ].map((s, i) => (
              <MotionReveal key={s.label} delay={i * 0.08}>
                <div className="border-b border-ink/15 py-7 md:py-9 grid md:grid-cols-12 gap-6 items-baseline">
                  <p className="md:col-span-3 text-[10px] uppercase tracking-[0.3em] text-ink/55">{s.label}</p>
                  <p className="md:col-span-6 font-display italic text-ink text-2xl md:text-3xl leading-snug">{s.value}</p>
                  <p className="md:col-span-3 text-ink/55 text-sm md:text-base">{s.hint}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          05 · BUILD — vier Säulen mit Section-Number-Anker
          ============================================================ */}
      <section className="relative bg-ink overflow-hidden py-24 md:py-36">
        <div className="absolute pointer-events-none select-none -bottom-[8%] -left-[2%] z-0">
          <SectionNumber number="05" rotation={-3} className="text-[260px] md:text-[480px] lg:text-[600px]" />
        </div>
        <div className="container-luxe relative z-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-12 mb-14 md:mb-16 items-end">
            <div className="md:col-span-7">
              <MotionReveal>
                <p className="eyebrow mb-5">III · Build</p>
              </MotionReveal>
              <MotionReveal delay={0.08}>
                <h2 className="leading-[0.92] tracking-[-0.02em]">
                  <span className="block mixed-type-line-1 text-cream/85 text-[44px] sm:text-[64px] md:text-[88px] lg:text-[100px]">Vier Säulen.</span>
                  <span className="block mixed-type-line-2 text-champagne -mt-1 text-[52px] sm:text-[72px] md:text-[100px] lg:text-[120px]">Eine Marke.</span>
                </h2>
              </MotionReveal>
            </div>
            <div className="md:col-span-5">
              <MotionReveal delay={0.15}>
                <p className="text-cream/55 text-base md:text-lg leading-relaxed max-w-md md:ml-auto">
                  Agency, Media, Events, Studio. Vier Bereiche, ein Team, ein Anspruch.
                </p>
              </MotionReveal>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-champagne/15">
            {[
              { num: "01", title: "Agency", desc: "Creator-Management & Talent-Repräsentation." },
              { num: "02", title: "Media", desc: "Brand-Kampagnen & Content-Produktion." },
              { num: "03", title: "Events", desc: "Live-Formate & Ranking-Shows." },
              { num: "04", title: "Studio", desc: "Original IP & Format-Entwicklung." },
            ].map((c, i) => (
              <MotionReveal key={c.num} delay={i * 0.06}>
                <div className="bg-ink p-8 md:p-10 h-full card-lift transition-all duration-500 hover:bg-champagne/[0.04]">
                  <p className="text-champagne text-[10px] uppercase tracking-[0.3em] mb-8">{c.num}</p>
                  <h3 className="font-display italic text-cream text-2xl md:text-3xl mb-4 leading-tight">
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
          06 · JOIN — asymmetrische Einladung
          ============================================================ */}
      <section className="relative bg-ink overflow-hidden py-24 md:py-36 border-t border-champagne/10">
        <div className="hero-glow-mesh" aria-hidden />
        <div className="absolute pointer-events-none select-none -bottom-[14%] -right-[6%] z-0">
          <SectionNumber number="06" rotation={4} className="text-[300px] md:text-[560px] lg:text-[720px]" />
        </div>
        <div className="container-luxe relative z-10">
          <div className="grid md:grid-cols-12 gap-10 md:gap-12 items-end">
            <div className="md:col-span-8">
              <MotionReveal>
                <p className="eyebrow mb-6">IV · Join</p>
              </MotionReveal>
              <MotionReveal delay={0.08}>
                <h2 className="leading-[0.9] tracking-[-0.025em]">
                  <span className="block mixed-type-line-1 text-cream/85 text-[52px] sm:text-[72px] md:text-[100px] lg:text-[124px]">Bereit für die</span>
                  <span className="block mixed-type-line-2 text-champagne -mt-1 text-[64px] sm:text-[88px] md:text-[120px] lg:text-[148px]">nächste Stufe?</span>
                </h2>
              </MotionReveal>
              <MotionReveal delay={0.18}>
                <p className="text-cream/60 text-base md:text-lg mt-7 max-w-xl leading-relaxed">
                  Bewerbung läuft direkt über den offiziellen TikTok-Agency-Link.
                </p>
              </MotionReveal>
              <MotionReveal delay={0.25}>
                <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-10">
                  <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-cta btn-shimmer">
                    Jetzt bewerben
                    <span className="btn-cta-arrow" aria-hidden>→</span>
                  </a>
                  <Link href="/contact" className="btn-cta-secondary">
                    Lieber persönlich? Kontakt
                  </Link>
                </div>
              </MotionReveal>
            </div>
            <div className="md:col-span-4">
              <MotionReveal delay={0.3}>
                <div className="border-l border-champagne/30 pl-5">
                  <p className="eyebrow mb-3">Direkter Kontakt</p>
                  <p className="font-display italic text-cream text-xl md:text-2xl leading-snug mb-2">
                    info@zoe-star.de
                  </p>
                  <p className="text-cream/45 text-xs">Antwort innerhalb 48h</p>
                </div>
              </MotionReveal>
            </div>
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
