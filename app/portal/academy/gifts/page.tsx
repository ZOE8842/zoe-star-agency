import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { GIFTS, type Gift } from "@/lib/academy/data";
import { TreasureSection } from "@/components/academy/TreasureSection";
import { GiftFaqSection } from "@/components/academy/GiftFaqSection";
import { EnigmaSection } from "@/components/academy/EnigmaSection";
import { FunktionenSection } from "@/components/academy/FunktionenSection";
import { ModerationSection } from "@/components/academy/ModerationSection";
import { UebersichtSection } from "@/components/academy/UebersichtSection";

export const dynamic = "force-dynamic";

// ── TABS ─────────────────────────────────────────────────────────────
// User-Briefing 2026-05-11: 12 Unter-Sektionen unter "TikTok LIVE"
// 4 mit Daten · 8 als Stub ("Bald verfuegbar")

type StubReason = "soon" | "in-arbeit";

interface TabDef {
  id: string;
  label: string;
  short: string;          // Kurztext fuer Mobile-Pills
  filter?: (g: Gift) => boolean;
  stub?: StubReason;
  intro?: string;         // Erklaer-Text oben in der Section
}

// Tabs deren Header (h2 + Count) durch die jeweilige Section-Komponente
// selbst gerendert wird. Default-Header wird dann unterdrueckt.
const CUSTOM_RENDER_TABS = new Set<string>([
  "schatz",
  "faq",
  "enigma",
  "funktionen",
  "moderation",
  "uebersicht",
]);

const TABS: TabDef[] = [
  {
    id: "live",
    label: "Geschenke im LIVE",
    short: "Live",
    filter: (g) => g.category === "standard",
    intro: "Alle regulaeren Geschenke die Zuschauer dir waehrend des LIVE schicken koennen. Nach Diamantenwert sortiert.",
  },
  {
    id: "team",
    label: "Teamgeschenke",
    short: "Team",
    filter: (g) => g.category === "team",
    intro: "Geschenke die Team-Fortschritt + Team-Belohnungen pushen. Team-Mechanik, Level + Ranglisten werden ergaenzt.",
  },
  {
    id: "exklusiv",
    label: "Exklusive Geschenke",
    short: "Exklusiv",
    filter: (g) => g.category === "exclusive" && !g.required_level,
    intro: "Premium-Geschenke ohne Level-Pflicht. Selten und mit grosser Animation.",
  },
  {
    id: "level",
    label: "Level Geschenke",
    short: "Level",
    filter: (g) => g.category === "exclusive" && !!g.required_level,
    intro: "Werden erst ab bestimmten Schenke-Leveln freigeschaltet.",
  },
  { id: "event",      label: "Event Geschenke",     short: "Event",     stub: "soon" },
  { id: "schatz",     label: "Schatztruhe",         short: "Schatz" },
  { id: "portal",     label: "Portal",              short: "Portal",    stub: "in-arbeit" },
  { id: "coins",      label: "Coin-System",         short: "Coins",     stub: "soon" },
  { id: "enigma",     label: "Enigma",              short: "Enigma" },
  { id: "funktionen", label: "Funktionen",          short: "Funktionen" },
  { id: "moderation", label: "Moderation",          short: "Mod" },
  { id: "strategien", label: "LIVE Strategien",     short: "Strategie", stub: "soon" },
  { id: "battles",    label: "Battles & Matches",   short: "Battle",    stub: "soon" },
  { id: "faq",        label: "FAQ",                 short: "FAQ" },
  { id: "uebersicht", label: "Komplettuebersicht",  short: "Uebersicht" },
];

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string }>;
}

export default async function AcademyGiftsPage({ searchParams }: PageProps) {
  const { profile } = await getAuthedProfile();
  const sp = await searchParams;
  const activeId = sp.tab && TABS.find((t) => t.id === sp.tab) ? sp.tab : "live";
  const tab = TABS.find((t) => t.id === activeId)!;
  const query = (sp.q || "").trim().toLowerCase();

  const filteredGifts: Gift[] = tab.filter
    ? GIFTS.filter(tab.filter)
        .filter((g) => !query || g.name_de.toLowerCase().includes(query))
        .sort((a, b) => a.coins - b.coins)
    : [];

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

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/portal/academy"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Academy
          </Link>
        </div>

        <p className="eyebrow mb-3">TikTok LIVE</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Geschenke, <span className="text-champagne">Schatztruhe</span> + Mechaniken.
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
          Die komplette TikTok-LIVE-Wissensdatenbank. Geschenke nach
          Kategorie, plus Schatztruhe, Portal, Coin-System, Battle-
          Mechanik. Klicke eine Sektion an.
        </p>

        {/* ── TABS ─────────────────────────────────────────────────── */}
        <nav
          aria-label="Sektionen"
          className="mb-8 -mx-4 px-4 overflow-x-auto"
        >
          <ul className="flex gap-2 min-w-max">
            {TABS.map((t) => {
              const isActive = t.id === tab.id;
              return (
                <li key={t.id}>
                  <Link
                    href={`/portal/academy/gifts?tab=${t.id}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`block px-3 py-2 text-[11px] uppercase tracking-[0.22em] border whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-champagne bg-champagne text-ink font-medium"
                        : t.stub
                        ? "border-cream/15 text-cream/45 hover:text-cream/65 hover:border-cream/30"
                        : "border-champagne/30 text-champagne/85 hover:border-champagne hover:text-champagne"
                    }`}
                  >
                    {t.label}
                    {t.stub && (
                      <span className="ml-2 text-[8px] opacity-70">
                        {t.stub === "in-arbeit" ? "in Arbeit" : "bald"}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── ACTIVE TAB CONTENT ──────────────────────────────────── */}
        <section className="mb-12">
          {!CUSTOM_RENDER_TABS.has(tab.id) && (
            <>
              <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <h2 className="font-display italic text-cream text-2xl md:text-3xl">
                  {tab.label}
                </h2>
                {!tab.stub && (
                  <span className="text-cream/45 text-[11px] uppercase tracking-[0.22em]">
                    {filteredGifts.length} Eintraege
                  </span>
                )}
              </div>
              {tab.intro && (
                <p className="text-cream/60 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
                  {tab.intro}
                </p>
              )}
            </>
          )}

          {tab.id === "schatz" ? (
            <TreasureSection />
          ) : tab.id === "faq" ? (
            <GiftFaqSection />
          ) : tab.id === "enigma" ? (
            <EnigmaSection />
          ) : tab.id === "funktionen" ? (
            <FunktionenSection />
          ) : tab.id === "moderation" ? (
            <ModerationSection />
          ) : tab.id === "uebersicht" ? (
            <UebersichtSection />
          ) : tab.stub ? (
            <StubBlock reason={tab.stub} label={tab.label} />
          ) : (
            <>
              {/* Search */}
              <form method="get" action="/portal/academy/gifts" className="mb-6">
                <input type="hidden" name="tab" value={tab.id} />
                <div className="relative">
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Geschenk suchen …"
                    className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/30 focus:outline-none"
                  />
                  {query && (
                    <Link
                      href={`/portal/academy/gifts?tab=${tab.id}`}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
                    >
                      Reset
                    </Link>
                  )}
                </div>
              </form>

              {/* Gift-Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {filteredGifts.map((g) => (
                  <GiftCard key={g.slug} gift={g} />
                ))}
              </div>

              {filteredGifts.length === 0 && (
                <p className="text-cream/45 italic text-sm">
                  Keine Treffer in dieser Kategorie.
                </p>
              )}
            </>
          )}
        </section>

        {/* ── KONTEXT-FOOTER ─────────────────────────────────────── */}
        <div className="border border-champagne/15 p-5 md:p-7">
          <p className="eyebrow mb-3">Kontext</p>
          <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-3">
            Coins kaufen Zuschauer im TikTok-Shop. Diamanten kommen bei
            dir an, wenn du Geschenke im LIVE bekommst — grob die Haelfte
            vom Coin-Preis. Auszahlung passiert nach TikTok-Cycle an dein
            verifiziertes Konto.
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

// ── COMPONENTS ─────────────────────────────────────────────────────

function tier(coins: number): string {
  if (coins <= 5) return "Mini";
  if (coins <= 99) return "Klein";
  if (coins <= 999) return "Mittel";
  if (coins <= 9999) return "Premium";
  return "Top-Tier";
}

const TIER_TONE: Record<string, string> = {
  Mini: "border border-cream/15 text-cream/55",
  Klein: "border border-champagne/30 text-champagne/85",
  Mittel: "border border-champagne/50 text-champagne",
  Premium: "bg-champagne/10 border border-champagne text-champagne",
  "Top-Tier": "bg-champagne text-ink",
};

function GiftCard({ gift }: { gift: Gift }) {
  const t = tier(gift.coins);
  return (
    <article
      className={`border p-5 flex flex-col transition-colors ${
        gift.whale
          ? "border-champagne bg-champagne/5 shadow-[0_0_24px_rgba(201,168,106,0.08)]"
          : "border-champagne/15 hover:border-champagne/40"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="font-display italic text-cream text-base md:text-lg leading-tight">
          {gift.name_de}
        </h3>
        <span
          className={`shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] ${TIER_TONE[t]}`}
        >
          {t}
        </span>
      </div>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="font-display italic font-black text-champagne text-2xl leading-none">
          {gift.coins.toLocaleString("de-DE")}
        </p>
        <p className="text-cream/45 text-[11px] uppercase tracking-[0.22em]">
          Coins
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap mt-auto">
        {gift.whale && (
          <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] bg-champagne text-ink">
            Whale
          </span>
        )}
        {gift.required_level !== undefined && (
          <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] border border-champagne/40 text-champagne/85">
            Lv. {gift.required_level}
          </span>
        )}
        {gift.required_level === undefined && gift.exclusive && (
          <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] border border-champagne/40 text-champagne/85">
            Exklusiv
          </span>
        )}
      </div>
    </article>
  );
}

function StubBlock({ reason, label }: { reason: StubReason; label: string }) {
  return (
    <div className="border border-dashed border-champagne/25 p-8 text-center bg-champagne/[0.02]">
      <p className="eyebrow text-champagne/80 mb-3">
        {reason === "in-arbeit" ? "In Arbeit" : "Bald verfuegbar"}
      </p>
      <p className="text-cream/70 text-base md:text-lg italic font-display mb-2">
        {label}
      </p>
      <p className="text-cream/45 text-sm leading-relaxed max-w-md mx-auto">
        Diese Sektion wird gerade aufgebaut. Inhalte folgen in den
        naechsten Updates.
      </p>
    </div>
  );
}
