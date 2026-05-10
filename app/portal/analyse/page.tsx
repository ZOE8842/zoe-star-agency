import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

export default async function AnalyseHubPage() {
  const { supabase, profile } = await getAuthedProfile();

  const [accountRes, liveRes] = await Promise.all([
    supabase
      .from("account_analyses")
      .select("id, status, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("live_performance_reports")
      .select("id, status, created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  const latestAccount = accountRes.data?.[0];
  const latestLive = liveRes.data?.[0];

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
        <p className="eyebrow mb-3">Analyse</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Profi-Blick auf <span className="text-champagne">deinen Auftritt.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-xl">
          Account Analyse zeigt dir wie dein Profil + Content wirken.
          LIVE Performance zeigt dir wo du in Streams, Battles und
          Watchtime stehst.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/portal/analyse/account"
            className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 p-6 md:p-7 transition-colors block group"
          >
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="font-display italic text-cream text-2xl md:text-3xl leading-tight">
                Account Analyse
              </h2>
              <span className="shrink-0 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] bg-champagne text-ink">
                Aktiv
              </span>
            </div>
            <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-3">
              Profil · Bio · Content · Branding
            </p>
            <p className="text-cream/65 text-sm md:text-base leading-relaxed mb-4">
              Bewertung deines TikTok-Auftritts: Display-Name, Bio,
              Profilbild, Top-Videos, Hook-Staerke, Watchtime-Faktoren,
              Branding-Konsistenz, konkrete Verbesserungs-Schritte.
            </p>
            {latestAccount && (
              <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em] mb-3">
                Letzte Analyse · {new Date(latestAccount.created_at).toLocaleDateString("de-DE")} · {latestAccount.status}
              </p>
            )}
            <p className="text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
              Oeffnen →
            </p>
          </Link>

          <Link
            href="/portal/analyse/live"
            className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 p-6 md:p-7 transition-colors block group"
          >
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="font-display italic text-cream text-2xl md:text-3xl leading-tight">
                LIVE Performance
              </h2>
              <span className="shrink-0 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] bg-champagne text-ink">
                Aktiv
              </span>
            </div>
            <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-3">
              Watchtime · Battles · Community
            </p>
            <p className="text-cream/65 text-sm md:text-base leading-relaxed mb-4">
              Auswertung deiner LIVE-Daten: Zuschauer-Schnitt, gueltige
              Tage, Watchtime, Battle-Auswertung, Tageszeit-Vorschlag,
              Wochen-Plan fuer das naechste Wachstums-Fenster.
            </p>
            {latestLive && (
              <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em] mb-3">
                Letzter Report · {new Date(latestLive.created_at).toLocaleDateString("de-DE")} · {latestLive.status}
              </p>
            )}
            <p className="text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
              Oeffnen →
            </p>
          </Link>
        </div>

        <p className="text-cream/35 text-xs mt-12 leading-relaxed">
          Quellen: TikTok Public Daten, TikTok Backstage, ZOE-Standards
          und Erkenntnisse aus dem offiziellen TikTok LIVE Deutschland-
          Account. KI-Analyse + manuelle Review werden kombiniert.
        </p>
      </main>
    </>
  );
}
