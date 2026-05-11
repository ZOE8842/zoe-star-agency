import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreatorShowcaseCard } from "@/components/CreatorShowcaseCard";
import { FeaturedCreatorsStrip } from "@/components/FeaturedCreatorsStrip";
import { SectionNumber } from "@/components/SectionNumber";
import {
  fetchHomepageCreators,
  toShowcaseCard,
  randomTake,
} from "@/lib/showcase/public";

export const metadata: Metadata = {
  title: "Creator — ZOE⭐ Star Agency",
  description:
    "Unsere TikTok-LIVE-Creator. Pro Reload eine andere Auswahl aus dem aktiven Roster.",
};

export const dynamic = "force-dynamic";

export default async function CreatorIndexPage() {
  const all = await fetchHomepageCreators();
  const picked = randomTake(all, 6).map(toShowcaseCard);

  return (
    <>
      <Header />
      <main className="bg-ink relative overflow-hidden">
        {/* HERO */}
        <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 overflow-hidden border-b border-champagne/10">
          <div className="hero-glow-mesh" aria-hidden />
          <div className="absolute pointer-events-none select-none -bottom-[10%] -right-[4%] z-0">
            <SectionNumber number="01" rotation={3} className="text-[260px] md:text-[520px] lg:text-[680px]" />
          </div>
          <div className="container-luxe relative z-10">
            <p className="eyebrow mb-4">Creator</p>
            <h1 className="leading-[0.92] tracking-[-0.025em]">
              <span className="block hero-rise mixed-type-line-1 text-cream/90 text-[44px] sm:text-[64px] md:text-[88px] lg:text-[108px]">Unsere</span>
              <span className="block hero-rise mixed-type-line-2 text-champagne -mt-1 text-[52px] sm:text-[72px] md:text-[100px] lg:text-[120px]">Creator-Liste.</span>
            </h1>
            <p className="text-cream/65 text-base md:text-lg leading-relaxed mt-7 max-w-2xl">
              Sechs Creator pro Besuch — zufaellig gewaehlt aus dem aktiven Roster. Klick eine Karte fuer das Einzelprofil.
            </p>
          </div>
        </section>

        {/* GRID */}
        <section className="relative bg-ink-mesh py-16 md:py-24 overflow-hidden">
          <div className="container-luxe relative z-10">
            {picked.length === 0 ? (
              <EmptyState />
            ) : picked.length >= 3 ? (
              <FeaturedCreatorsStrip creators={picked} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {picked.map((c) => (
                  <CreatorShowcaseCard key={c.profileHref ?? c.displayName} {...c} />
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <Link href="/kooperationen" className="btn-cta-secondary inline-flex items-center gap-2">
                Alle Creator fuer Kooperationen ansehen
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function EmptyState() {
  return (
    <div className="border border-champagne/15 p-12 text-center">
      <p className="text-cream/70 font-display italic text-2xl mb-3">
        Roster wird gerade aufgebaut.
      </p>
      <p className="text-cream/45 text-sm">
        Sobald die ersten Creator approved sind, erscheinen sie hier.
      </p>
    </div>
  );
}
