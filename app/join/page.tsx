import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { CreatorApplicationForm } from "@/components/forms/CreatorApplicationForm";
import { loadPublicLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Creator werden",
  description:
    "Bewirb dich bei ZOE Star Agency. Wir suchen Creator mit eigener Stimme und Lust auf langfristiges Wachstum.",
  alternates: { canonical: "/join" },
};

export default async function JoinPage() {
  const { t } = await loadPublicLocale();
  return (
    <>
      <Header />
      <main className="bg-ink">
        <section className="container-luxe pt-24 md:pt-36 pb-14 md:pb-20">
          <MotionReveal>
            <p className="eyebrow mb-5">{t("join_page.eyebrow_creator_werden")}</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h1 className="heading-display text-4xl md:text-7xl text-cream mb-5 leading-[0.95] max-w-4xl">
              Werde Teil von <span className="text-champagne">ZOE</span>.
            </h1>
          </MotionReveal>
          <MotionReveal delay={0.2}>
            <p className="text-cream/70 text-base md:text-2xl leading-relaxed max-w-3xl mb-6">
              Wir suchen Creator mit Vision, Eigensinn und Lust auf Wachstum.
              Wenn du den nächsten Schritt gehen willst — wir hören zu.
            </p>
          </MotionReveal>
          <MotionReveal delay={0.25}>
            <p className="text-champagne/80 text-[11px] md:text-xs uppercase tracking-[0.25em] mb-7">
              Offizielle TikTok Elite-Agentur · Aktive Creator-Community
            </p>
          </MotionReveal>
          <MotionReveal delay={0.3}>
            <a href="#apply" className="btn-primary">Jetzt bewerben</a>
          </MotionReveal>
        </section>

        <section className="container-luxe pb-20">
          <MotionReveal>
            <p className="eyebrow mb-10">{t("join_page.eyebrow_wer_passt")}</p>
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

        <section id="apply" className="container-luxe pb-20 scroll-mt-24">
          <MotionReveal>
            <p className="eyebrow mb-10">{t("join_page.eyebrow_so_laeuft")}</p>
          </MotionReveal>
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              { num: "01", title: "Anfrage", desc: "Kurzes Formular ausfüllen — TikTok-Username, Sprache, kurzer Pitch. 2 Minuten." },
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
            <h2 className="heading-display text-2xl md:text-4xl text-cream mb-3 leading-tight text-center">
              Bereit zu <span className="text-champagne">starten</span>?
            </h2>
            <p className="text-cream/70 text-sm md:text-base mb-10 max-w-xl mx-auto text-center">
              Fülle das Formular aus — wir prüfen dein Profil und melden uns innerhalb 1–3 Werktagen über TikTok oder Telegram.
            </p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <CreatorApplicationForm />
          </MotionReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
