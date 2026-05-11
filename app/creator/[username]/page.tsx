import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TikTokIcon, InstagramIcon, ArrowExternalIcon } from "@/components/SocialIcons";
import { SectionNumber } from "@/components/SectionNumber";
import { fetchCreatorByUsername } from "@/lib/showcase/public";

interface Params {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;
  const c = await fetchCreatorByUsername(username);
  if (!c) return { title: "Creator nicht gefunden" };
  const name = c.displayName || `@${c.tiktokUsername}`;
  return {
    title: `${name} — ZOE⭐ Star Agency`,
    description: c.bio || `Creator-Profil von ${name} bei ZOE⭐ Star Agency. TikTok LIVE Creator Network.`,
    openGraph: c.showcaseImage
      ? { images: [{ url: c.showcaseImage }] }
      : undefined,
  };
}

export const dynamic = "force-dynamic";

export default async function CreatorDetailPage({ params }: Params) {
  const { username } = await params;
  const c = await fetchCreatorByUsername(username);
  if (!c) notFound();

  const name = c.displayName || `@${c.tiktokUsername}`;
  const coopUrl = `/kooperationen?creator=${encodeURIComponent(c.tiktokUsername || "")}#anfrage`;

  return (
    <>
      <Header />
      <main className="bg-ink relative overflow-hidden">
        {/* BACK */}
        <div className="container-luxe pt-28 md:pt-32 relative z-10">
          <Link
            href="/creator"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Alle Creator
          </Link>
        </div>

        {/* HERO · 2-Spalt mit Showcase-Bild + Header */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <div className="absolute pointer-events-none select-none -top-[6%] -right-[4%] z-0">
            <SectionNumber number="" rotation={3} className="text-[260px] md:text-[520px] lg:text-[680px]" />
          </div>

          <div className="container-luxe relative z-10">
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-start">
              {/* Showcase-Bilder */}
              <div className="md:col-span-7">
                {c.showcaseImage ? (
                  <div className="aspect-[3/4] md:aspect-[4/5] overflow-hidden border border-champagne/20 bg-ink">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.showcaseImage}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/5] border border-champagne/20 bg-champagne/5 flex items-center justify-center">
                    <p className="text-cream/35 italic font-display text-xl">
                      Kein Bild
                    </p>
                  </div>
                )}

                {/* 2. Bild kleiner darunter */}
                {c.showcaseImages[1] && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {c.showcaseImages.slice(1, 3).map((src, i) => (
                      <div key={i} className="aspect-square overflow-hidden border border-champagne/15">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" aria-hidden className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info-Spalte */}
              <div className="md:col-span-5 md:pt-4">
                {c.category && (
                  <p className="eyebrow mb-3">{c.category}</p>
                )}
                <h1 className="font-display italic text-cream text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.02em] mb-4">
                  {name}
                </h1>

                {c.tiktokUsername && (
                  <p className="text-cream/45 text-sm mb-6">
                    @{c.tiktokUsername}
                  </p>
                )}

                {c.bio && (
                  <p className="text-cream/75 text-base md:text-lg leading-relaxed mb-8">
                    {c.bio}
                  </p>
                )}

                {/* Meta-Pills */}
                {(c.language || c.region) && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {c.region && (
                      <span className="px-3 py-1 border border-champagne/25 text-cream/70 text-xs uppercase tracking-[0.22em]">
                        {c.region}
                      </span>
                    )}
                    {c.language && (
                      <span className="px-3 py-1 border border-champagne/25 text-cream/70 text-xs uppercase tracking-[0.22em]">
                        {c.language}
                      </span>
                    )}
                  </div>
                )}

                {/* Social Links */}
                <div className="space-y-3 mb-8">
                  {c.tiktokUrl && (
                    <a
                      href={c.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 border border-champagne/30 hover:border-champagne hover:bg-champagne/5 transition-colors text-cream group"
                    >
                      <TikTokIcon className="w-5 h-5 text-champagne shrink-0" />
                      <span className="flex-1 text-sm">Auf TikTok ansehen</span>
                      <ArrowExternalIcon className="w-3.5 h-3.5 text-cream/45 group-hover:text-champagne group-hover:translate-x-0.5 transition-all" />
                    </a>
                  )}
                  {c.instagramUrl && (
                    <a
                      href={c.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 border border-champagne/30 hover:border-champagne hover:bg-champagne/5 transition-colors text-cream group"
                    >
                      <InstagramIcon className="w-5 h-5 text-champagne shrink-0" />
                      <span className="flex-1 text-sm">Auf Instagram ansehen</span>
                      <ArrowExternalIcon className="w-3.5 h-3.5 text-cream/45 group-hover:text-champagne group-hover:translate-x-0.5 transition-all" />
                    </a>
                  )}
                </div>

                {/* Business-Button · alles ueber Agency */}
                <Link
                  href={coopUrl}
                  className="btn-cta btn-shimmer w-full justify-center"
                >
                  Kooperation anfragen
                  <span className="btn-cta-arrow" aria-hidden>→</span>
                </Link>
                <p className="text-cream/40 text-xs mt-3 leading-relaxed">
                  Business-Anfragen laufen ueber die Agency. Kein direkter
                  Creator-Kontakt per DM oder Mail — sauberer Weg fuer alle.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
