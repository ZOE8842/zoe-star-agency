import Link from "next/link";
import type { Metadata } from "next";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import {
  INSIDER_CARDS,
  INSIDER_TONE_LABEL,
  INSIDER_TONE_STYLE,
  INSIDER_TONE_LABEL_STYLE,
  type InsiderTone,
} from "@/lib/academy/insider";

export const metadata: Metadata = {
  title: "Insider",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Reihenfolge der Bloecke: erst was schadet, dann was hilft.
const TONE_ORDER: InsiderTone[] = ["killer", "warn", "topmove", "tip"];

const TONE_INTRO: Record<InsiderTone, string> = {
  killer: "Fehler, die deine Ausspielung sofort kosten.",
  warn: "Dinge, die du besser sein laesst.",
  topmove: "Was die staerksten Creator anders machen.",
  tip: "Kleine Handgriffe mit spuerbarer Wirkung.",
};

export default async function AcademyInsiderPage() {
  const { profile } = await getAuthedProfile();

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="container-luxe relative z-10 py-12 md:py-16 pb-28 md:pb-16 max-w-3xl">
        <Link
          href="/portal/academy"
          className="inline-flex items-center min-h-11 -ml-3 px-3 text-cream/60 hover:text-champagne text-xs uppercase tracking-[0.25em] transition-colors"
        >
          ← Academy
        </Link>

        <p className="eyebrow mb-3 mt-6">Insider · harte Wahrheit</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Aus echten <span className="text-champagne">Lives</span>.
        </h1>
        <p className="text-cream/60 text-base leading-relaxed mb-10 max-w-2xl">
          {INSIDER_CARDS.length} Beobachtungen aus dem Agentur-Alltag. Kurz,
          direkt, ohne Umweg. Erfahrungswerte, keine offiziellen
          TikTok-Angaben.
        </p>

        {TONE_ORDER.map((tone) => {
          const cards = INSIDER_CARDS.filter((c) => c.tone === tone);
          if (!cards.length) return null;
          return (
            <section key={tone} className="mb-10">
              <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                <p className="eyebrow">{INSIDER_TONE_LABEL[tone]}</p>
                <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                  {cards.length} {cards.length === 1 ? "Karte" : "Karten"}
                </span>
              </div>
              <p className="text-cream/50 text-sm mb-4">{TONE_INTRO[tone]}</p>

              <ul className="grid gap-2.5 md:grid-cols-2">
                {cards.map((c, i) => (
                  <li
                    key={`${tone}-${i}`}
                    className={`border p-4 md:p-5 ${INSIDER_TONE_STYLE[c.tone]}`}
                  >
                    <span
                      className={`inline-block px-2 py-0.5 mb-2 text-[9px] uppercase tracking-[0.22em] ${INSIDER_TONE_LABEL_STYLE[c.tone]}`}
                    >
                      {INSIDER_TONE_LABEL[c.tone]}
                    </span>
                    <p className="text-cream text-sm md:text-base leading-snug font-medium mb-1.5">
                      {c.title}
                    </p>
                    <p className="text-cream/65 text-xs md:text-sm leading-relaxed">
                      {c.body}
                    </p>
                    {c.why && (
                      <p className="text-cream/40 text-[10px] italic mt-1.5">
                        {c.why}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="border border-champagne/15 p-5 md:p-6">
          <p className="text-cream/65 text-sm leading-relaxed mb-3">
            Ausfuehrlich steht das alles in den Lektionen: warum der Start
            entscheidet, wie Matches getaktet werden und was die Auszahlung
            wirklich bestimmt.
          </p>
          <Link
            href="/portal/academy"
            className="inline-flex items-center justify-center min-h-11 px-4 border border-champagne/30 hover:border-champagne hover:bg-champagne/5 text-champagne text-xs uppercase tracking-[0.25em] transition-colors"
          >
            Zu den Themengruppen →
          </Link>
        </div>
      </main>
    </>
  );
}
