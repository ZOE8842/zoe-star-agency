import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { GIFTS } from "@/lib/academy/data";

export const dynamic = "force-dynamic";

function tier(diamonds: number): string {
  if (diamonds <= 5) return "Mini";
  if (diamonds <= 99) return "Klein";
  if (diamonds <= 999) return "Mittel";
  if (diamonds <= 9999) return "Premium";
  return "Top-Tier";
}

const TIER_TONE: Record<string, string> = {
  "Mini": "border border-cream/15 text-cream/55",
  "Klein": "border border-champagne/30 text-champagne/85",
  "Mittel": "border border-champagne/50 text-champagne",
  "Premium": "bg-champagne/10 border border-champagne text-champagne",
  "Top-Tier": "bg-champagne text-ink",
};

export default async function AcademyGiftsPage() {
  const { profile } = await getAuthedProfile();
  const sorted = [...GIFTS].sort((a, b) => a.diamonds - b.diamonds);

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

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-3xl">
        <div className="mb-10">
          <Link
            href="/portal/academy"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Academy
          </Link>
        </div>

        <p className="eyebrow mb-3">TikTok Geschenke</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Galerie + <span className="text-champagne">Diamantenwerte</span>.
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          Alle relevanten TikTok-Geschenke mit Coin-Preis (was Zuschauer
          zahlen) und Diamantenwert (was bei dir ankommt). Sortiert nach
          Wert. Praktisch waehrend du streamst.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-12">
          {sorted.map((g) => {
            const t = tier(g.diamonds);
            return (
              <article
                key={g.slug}
                className="border border-champagne/15 hover:border-champagne/40 transition-colors p-5 flex flex-col"
              >
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <h2 className="font-display italic text-cream text-lg leading-tight">
                    {g.name}
                  </h2>
                  <span className={`shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] ${TIER_TONE[t]}`}>
                    {t}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-3">
                  <p className="font-display italic font-black text-champagne text-2xl leading-none">
                    {g.diamonds.toLocaleString("de-DE")}
                  </p>
                  <p className="text-cream/45 text-[11px] uppercase tracking-[0.22em]">
                    Diamonds
                  </p>
                </div>
                <p className="text-cream/65 text-xs mb-2">
                  {g.coins.toLocaleString("de-DE")} Coins · was Zuschauer zahlen
                </p>
                <p className="text-cream/55 text-xs leading-relaxed mt-auto">
                  {g.description}
                </p>
                <p className="text-cream/35 text-[10px] uppercase tracking-[0.22em] mt-3">
                  {g.use_case}
                </p>
              </article>
            );
          })}
        </div>

        <div className="border border-champagne/15 p-5 md:p-7">
          <p className="eyebrow mb-3">Kontext</p>
          <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-3">
            Coins kaufen Zuschauer im TikTok Shop. Diamonds kommen bei dir
            an, wenn TikTok ueber dein LIVE Geschenke verteilt — grob die
            Haelfte vom Coin-Preis. Auszahlung passiert nach TikTok-Cycle
            an dein verifiziertes Konto.
          </p>
          <p className="text-cream/55 text-sm leading-relaxed">
            Bitte niemals offen "schickt mir XY" rufen — das wirkt billig
            und triggert Algorithmus-Drosselung. Stattdessen: Kontext
            schaffen, Battle-Stimmung aufbauen, Geschenke entstehen lassen.
          </p>
        </div>
      </main>
    </>
  );
}
