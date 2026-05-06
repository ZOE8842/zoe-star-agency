import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";

const APPLY_URL =
  "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756";

export default function HomePage() {
  return (
    <>
      <Header />

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center bg-ink overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-champagne/15 via-transparent to-transparent" />
        </div>

        <div className="container-luxe relative z-10 pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="max-w-4xl">
            <MotionReveal>
              <p className="eyebrow mb-6">Eine neue Ära für Creator</p>
            </MotionReveal>
            <MotionReveal delay={0.1} as="h1">
              <span className="heading-display text-[44px] sm:text-[64px] md:text-[88px] lg:text-[112px] leading-[0.95] block mb-8 text-cream">
                Premium Talent.<br />
                Media.<br />
                <span className="text-champagne">Entertainment.</span>
              </span>
            </MotionReveal>
            <MotionReveal delay={0.25}>
              <p className="text-cream/70 text-base md:text-2xl leading-relaxed max-w-2xl mb-10">
                ZOE Star Agency entwickelt die nächste Generation von Creator-Marken.
                Mit redaktioneller Präzision, Business-Tiefe und globalem Anspruch.
              </p>
            </MotionReveal>
            <MotionReveal delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Als Creator bewerben
                </a>
                <Link href="/contact" className="btn-outline">
                  Kontakt aufnehmen
                </Link>
              </div>
            </MotionReveal>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/30 text-[10px] uppercase tracking-[0.4em] hidden md:block">
          Scroll
        </div>
      </section>

      {/* WARUM ZOE */}
      <section className="bg-ink py-20 md:py-28 border-t border-champagne/10">
        <div className="container-luxe">
          <MotionReveal>
            <p className="eyebrow mb-4 text-center">Warum ZOE</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h2 className="heading-display text-3xl md:text-5xl text-center text-cream mb-16 max-w-3xl mx-auto leading-tight">
              Eine Agentur, die <span className="text-champagne">mitdenkt</span>.
            </h2>
          </MotionReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { eyebrow: "01", title: "Creator-Management", desc: "Strategische Begleitung beim Aufbau deiner Marke. Von Account-Audit bis Content-Plan." },
              { eyebrow: "02", title: "Live-Wachstum", desc: "TikTok-LIVE auf Premium-Niveau. Ranking-Coaching, Battle-Strategie, Slot-Planung." },
              { eyebrow: "03", title: "Kampagnen & Brand-Deals", desc: "Brand-Kooperationen, Produkt-Drops und redaktionelle Formate mit echten Marken." },
              { eyebrow: "04", title: "Community & Support", desc: "Direkter Zugang zu Manager, Tipps, Templates und 1:1-Sessions im Creator-Portal." },
            ].map((c, i) => (
              <MotionReveal key={c.eyebrow} delay={i * 0.08}>
                <div className="border border-champagne/15 hover:border-champagne/40 transition-all duration-500 p-6 md:p-7 h-full">
                  <p className="text-champagne text-[10px] uppercase tracking-[0.3em] mb-5">{c.eyebrow}</p>
                  <h3 className="font-display italic font-black text-xl md:text-2xl text-cream mb-3 leading-tight">{c.title}</h3>
                  <p className="text-cream/60 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FÜR WEN */}
      <section className="bg-ink py-20 md:py-28">
        <div className="container-luxe">
          <MotionReveal>
            <p className="eyebrow mb-4 text-center">Für wen</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h2 className="heading-display text-3xl md:text-5xl text-center text-cream mb-16 max-w-3xl mx-auto leading-tight">
              Drei Wege, mit uns zu <span className="text-champagne">arbeiten</span>.
            </h2>
          </MotionReveal>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Creator",
                desc: "Du machst TikTok-Content und willst auf nächste Stufe. Wir bauen mit dir Strategie, Live-Plan und Brand-Identität.",
                cta: "Bewerben",
                href: APPLY_URL,
                external: true,
              },
              {
                title: "Marken",
                desc: "Authentische Reichweite via redaktionell gepflegte Creator. Kein Scattergun-Influencer, sondern kuratierte Partnerschaft.",
                cta: "Kooperation anfragen",
                href: "/kooperationen",
                external: false,
              },
              {
                title: "Manager & Partner",
                desc: "Du betreust Creator und suchst Infrastruktur, Tools und Workflow? Wir öffnen Manager-Profile auf Anfrage.",
                cta: "Kontakt aufnehmen",
                href: "/contact",
                external: false,
              },
            ].map((c, i) => (
              <MotionReveal key={c.title} delay={i * 0.1}>
                <div className="border border-champagne/15 p-7 md:p-8 h-full flex flex-col">
                  <h3 className="font-display italic font-black text-2xl md:text-3xl text-cream mb-4">
                    {c.title}
                  </h3>
                  <p className="text-cream/60 text-sm md:text-base leading-relaxed mb-8 flex-1">
                    {c.desc}
                  </p>
                  {c.external ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-champagne text-[11px] uppercase tracking-[0.25em] hover:text-champagne-300 inline-flex items-center gap-2">
                      {c.cta} <span aria-hidden="true">→</span>
                    </a>
                  ) : (
                    <Link href={c.href} className="text-champagne text-[11px] uppercase tracking-[0.25em] hover:text-champagne-300 inline-flex items-center gap-2">
                      {c.cta} <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFEST */}
      <section className="bg-cream text-ink py-20 md:py-28 light:bg-cream">
        <div className="container-luxe text-center max-w-3xl mx-auto">
          <MotionReveal>
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink/60 mb-6">Manifest</p>
          </MotionReveal>
          <MotionReveal delay={0.15}>
            <p className="font-display italic font-black text-2xl md:text-4xl leading-tight text-ink">
              Wir bauen keine TikTok-Agentur.
              <br />
              Wir bauen die Bühne, auf der Premium-Talent zur Marke wird.
            </p>
          </MotionReveal>
        </div>
      </section>

      {/* SAEULEN */}
      <section className="bg-ink py-20 md:py-28">
        <div className="container-luxe">
          <MotionReveal>
            <p className="eyebrow mb-4 text-center">Unsere Welt</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h2 className="heading-display text-3xl md:text-5xl text-center text-cream mb-16 leading-tight">
              Vier <span className="text-champagne">Säulen</span>.<br />Eine Marke.
            </h2>
          </MotionReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Agency", desc: "Creator-Management & Talent-Repräsentation" },
              { title: "Media", desc: "Brand-Kampagnen & Content-Produktion" },
              { title: "Events", desc: "Live-Formate & Ranking-Shows" },
              { title: "Studio", desc: "Original IP & Format-Entwicklung" },
            ].map((cat, i) => (
              <MotionReveal key={cat.title} delay={i * 0.08}>
                <div className="border border-champagne/15 p-7 md:p-8 h-full">
                  <p className="eyebrow mb-5">{cat.title}</p>
                  <h3 className="font-display italic font-black text-2xl md:text-3xl text-cream mb-3 leading-tight">
                    {cat.title}
                  </h3>
                  <p className="text-cream/60 text-sm leading-relaxed">{cat.desc}</p>
                </div>
              </MotionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* APPLY-CARD */}
      <section className="bg-ink py-20 md:py-28">
        <div className="container-luxe">
          <MotionReveal>
            <div className="relative border border-champagne/30 bg-champagne/5 p-10 md:p-16 text-center max-w-4xl mx-auto overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-champagne/10 blur-3xl" />
              </div>
              <div className="relative">
                <p className="eyebrow mb-5">Bewerbung</p>
                <h2 className="heading-display text-3xl md:text-5xl text-cream mb-5 leading-tight">
                  Bereit für die <span className="text-champagne">nächste Stufe</span>?
                </h2>
                <p className="text-cream/70 text-base md:text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
                  Wir sehen uns deine Anfrage persönlich an. Direkt-Bewerbung läuft
                  über den offiziellen TikTok-Agency-Link.
                </p>
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Jetzt bewerben
                </a>
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* KONTAKT-TEASER */}
      <section className="bg-ink py-16 md:py-20 border-t border-champagne/10">
        <div className="container-luxe">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 max-w-4xl mx-auto">
            <div>
              <p className="eyebrow mb-3">Kontakt</p>
              <h3 className="font-display italic text-2xl md:text-3xl text-cream leading-tight">
                Lass uns reden.
              </h3>
              <p className="text-cream/60 text-sm mt-2">
                <a href="mailto:info@zoe-star.de" className="text-champagne hover:underline">info@zoe-star.de</a>
              </p>
            </div>
            <Link href="/contact" className="btn-outline whitespace-nowrap">
              Nachricht senden
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
