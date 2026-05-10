import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CATEGORIES } from "@/lib/academy/data";

export const dynamic = "force-dynamic";

export default async function AcademyHubPage() {
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

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-3xl">
        <p className="eyebrow mb-3">Academy</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Alles was du fuer <span className="text-champagne">starkes LIVE</span> wissen musst.
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          Praktisches Wissen aus Backstage-Schulungen, dem offiziellen
          TikTok LIVE Deutschland-Account und ZOE-Standards. Kein PDF-Spam,
          keine Theorie-Wuesten — direkt anwendbar.
        </p>

        <div className="grid gap-3 md:gap-4 md:grid-cols-2">
          <Link
            href="/portal/academy/gifts"
            className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group md:col-span-2"
          >
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight">
                TikTok Geschenke — Galerie
              </h2>
              <span className="shrink-0 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] bg-champagne text-ink">
                Galerie
              </span>
            </div>
            <p className="text-cream/65 text-sm md:text-base leading-relaxed">
              Komplette Uebersicht — Bild, Diamantenwert, Coin-Preis und
              Bedeutung im LIVE. Praktisch waehrend du streamst.
            </p>
            <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
              Oeffnen →
            </p>
          </Link>

          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/portal/academy/${cat.slug}`}
              className="border border-champagne/15 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2.5">
                <h2 className="font-display italic text-cream text-lg md:text-xl leading-tight">
                  {cat.title}
                </h2>
                <span className="shrink-0 text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                  {cat.lessons.length} Lektion{cat.lessons.length === 1 ? "" : "en"}
                </span>
              </div>
              <p className="text-cream/55 text-sm leading-relaxed">
                {cat.intro}
              </p>
              <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
                Reinlesen →
              </p>
            </Link>
          ))}
        </div>

        <p className="text-cream/35 text-xs mt-12 leading-relaxed">
          Fehlt was? Schick uns einen Hinweis ueber Telefon-Termin oder
          Nachricht. Academy waechst mit der Community.
        </p>
      </main>
    </>
  );
}
