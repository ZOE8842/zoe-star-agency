import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { PerformanceInsightBlock } from "@/components/dashboard/PerformanceInsightBlock";
import { loadLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// /portal/analyse — V5 Refactor (2026-05-16)
//
// STRUKTUR:
//   1. LIVE Performance (Standard-Block, immer sichtbar)
//      → kompakte Coaching-Auswertung der aktuellen Monats-KPIs
//      → 3 Spalten: Was laeuft / Was bremst / Empfehlung
//
//   2. Tiefere Analysen (Auswahl-Karten, kein Auto-Render)
//      → Profil pruefen      (Account Analyse)
//      → Content pruefen     (Content-Helper)
//      → Video analysieren   (neuer Content-Review)
//
// PerformanceInsightBlock wurde zuvor im Creator-Dashboard gerendert,
// gehoert thematisch aber hierher (Analyse-Ebene, nicht Status-Ebene).

export default async function AnalyseHubPage() {
  const { supabase, profile } = await getAuthedProfile();
  const { t } = await loadLocale();

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

  const firstName = profile.display_name?.split(" ")[0] || "Creator";

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
        <p className="eyebrow mb-3">{t("analyse.title")}</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          LIVE Performance & <span className="text-champagne">Deep-Checks.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 md:mb-12 max-w-xl">
          Oben deine aktuelle LIVE Performance auf einen Blick.
          Darunter optionale Tiefen-Analysen, die du nur startest, wenn du
          sie brauchst — kein Auto-Spam.
        </p>

        {/* ============================================================
            1. LIVE PERFORMANCE — Standard-Block (immer sichtbar)
            ============================================================ */}
        <PerformanceInsightBlock
          supabase={supabase}
          profileId={profile.id}
          firstName={firstName}
        />

        {/* ============================================================
            2. AUSWAHL · tiefere Analysen (kein Auto-Render)
            ============================================================ */}
        <section className="mt-2">
          <p className="eyebrow mb-5">{t("analyse_deep.deep_eyebrow")}</p>

          <div className="grid gap-3 md:gap-4 md:grid-cols-3">
            <Link
              href="/portal/analyse/account"
              className="border border-champagne/25 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
            >
              <p className="text-cream/50 text-[10px] uppercase tracking-[0.25em] mb-3">
                {t("analyse_deep.profil_title")}
              </p>
              <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight group-hover:text-champagne transition-colors">
                {t("analyse_deep.profil_title")}
              </h2>
              <p className="text-cream/55 text-xs md:text-sm leading-relaxed mt-3">
                {t("analyse_deep.profil_desc")}
              </p>
              {latestAccount && (
                <p className="text-cream/35 text-[10px] uppercase tracking-[0.22em] mt-4">
                  {t("analyse_deep.latest_account")} · {new Date(latestAccount.created_at).toLocaleDateString("de-DE")}
                </p>
              )}
            </Link>

            <Link
              href="/portal/services/content-helper"
              className="border border-champagne/25 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
            >
              <p className="text-cream/50 text-[10px] uppercase tracking-[0.25em] mb-3">
                {t("analyse_deep.content_title")}
              </p>
              <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight group-hover:text-champagne transition-colors">
                {t("analyse_deep.content_title")}
              </h2>
              <p className="text-cream/55 text-xs md:text-sm leading-relaxed mt-3">
                {t("analyse_deep.content_desc")}
              </p>
            </Link>

            <Link
              href="/portal/services/content-helper/new"
              className="border border-champagne/25 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
            >
              <p className="text-cream/50 text-[10px] uppercase tracking-[0.25em] mb-3">
                {t("analyse_deep.video_title")}
              </p>
              <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight group-hover:text-champagne transition-colors">
                {t("analyse_deep.video_title")}
              </h2>
              <p className="text-cream/55 text-xs md:text-sm leading-relaxed mt-3">
                {t("analyse_deep.video_desc")}
              </p>
            </Link>
          </div>

          {/* LIVE-Report (Detail-Report) bleibt als Side-Link verfuegbar,
              ist aber kein Auswahl-Tile mehr — der neue Standardblock
              oben deckt den taeglichen Bedarf ab. */}
          {latestLive && (
            <p className="text-cream/40 text-xs mt-6">
              Letzter LIVE-Detail-Report:{" "}
              <Link
                href="/portal/analyse/live"
                className="text-champagne hover:text-champagne-300 underline-offset-4 hover:underline"
              >
                {new Date(latestLive.created_at).toLocaleDateString("de-DE")} · {latestLive.status}
              </Link>
            </p>
          )}
        </section>

        <p className="text-cream/35 text-xs mt-12 leading-relaxed">
          Quellen: TikTok Public Daten, TikTok Backstage, ZOE-Standards
          und Erkenntnisse aus dem offiziellen TikTok LIVE Deutschland-Account.
          KI-Analyse + manuelle Review werden kombiniert.
        </p>
      </main>
    </>
  );
}
