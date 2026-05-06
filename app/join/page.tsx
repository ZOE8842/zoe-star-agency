import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";

const APPLY_URL =
  "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756";

export const metadata: Metadata = {
  title: "Creator werden",
  description:
    "Bewirb dich bei ZOE Star Agency. Wir suchen Creator mit eigener Stimme und Lust auf langfristiges Wachstum.",
};

export default function JoinPage() {
  return (
    <>
      <Header />
      <main className="bg-ink">
        <section className="container-luxe pt-32 md:pt-40 pb-20">
          <MotionReveal>
            <p className="eyebrow mb-5">Creator werden</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h1 className="heading-display text-4xl md:text-7xl text-cream mb-6 leading-[0.95] max-w-4xl">
              Werde Teil von <span className="text-champagne">ZOE</span>.
            </h1>
          </MotionReveal>
          <MotionReveal delay={0.2}>
            <p className="text-cream/70 text-lg md:text-2xl leading-relaxed max-w-3xl">
              Wir suchen Creator mit Vision, Eigensinn und Lust auf Wachstum.
              Wenn du den nächsten Schritt gehen willst — wir hören zu.
            </p>
          </MotionReveal>
        </section>

        <section className="container-luxe pb-20">
          <MotionReveal>
            <p className="eyebrow mb-10">Wer passt zu uns</p>
          </MotionReveal>
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              { title: "Eigene Stimme", desc: "Du hast eine klare Niche, Persönlichkeit und ein Wiedererkennbares Profil." },
              { title: "Aktiv auf TikTok", desc: "Mindestens 2-3 Posts pro Woche, plus Bereitschaft für regelmäßige LIVES." },
              { title: "Wachstums-orientiert", desc: "Du willst nicht spielen — du willst eine Karriere bauen." },
            ].map((c, i) => (
              <MotionReveal key={c.title} delay={i * 0.08}>
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
            <p className="eyebrow mb-10">So läuft die Bewerbung</p>
          </MotionReveal>
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              { num: "01", title: "Bewerbung", desc: "Über den offiziellen TikTok-Agency-Link. Kurz, schnell, unkompliziert." },
              { num: "02", title: "Audit-Call", desc: "Wir schauen uns dein Profil an und sprechen 15-30 Min mit dir." },
              { num: "03", title: "Onboarding", desc: "Bei Match: Vertrag, Portal-Zugang und persönlicher Manager." },
            ].map((c, i) => (
              <MotionReveal key={c.num} delay={i * 0.08}>
                <div className="border border-champagne/15 p-7 md:p-8 h-full">
                  <p className="text-champagne text-[10px] uppercase tracking-[0.3em] mb-4">{c.num}</p>
                  <h3 className="font-display italic font-black text-xl md:text-2xl text-cream mb-3">
                    {c.title}
                  </h3>
                  <p className="text-cream/60 text-sm md:text-base leading-relaxed">{c.desc}</p>
                </div>
              </MotionReveal>
            ))}
          </div>

          <MotionReveal>
            <div className="border border-champagne/30 bg-champagne/5 p-8 md:p-12 text-center max-w-3xl mx-auto">
              <h2 className="heading-display text-2xl md:text-4xl text-cream mb-5 leading-tight">
                Bereit zu <span className="text-champagne">starten</span>?
              </h2>
              <p className="text-cream/70 text-sm md:text-base mb-8 max-w-xl mx-auto">
                Bewerbung läuft direkt über den offiziellen TikTok-Agency-Link.
                Wir melden uns innerhalb von 1–3 Werktagen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Jetzt bewerben
                </a>
                <Link href="/contact" className="btn-outline">Lieber persönlich? Kontakt</Link>
              </div>
            </div>
          </MotionReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
