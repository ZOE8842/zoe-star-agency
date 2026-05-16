// /portal/admin/umsatz/creator/[handle]
// Admin-only Detail-Page · Monats-Historie pro Creator
//
// Quelle: creator_revenue_metrics (alle Perioden fuer diesen Handle).
// Aggregiert: Gesamt-Umsatz · Activity · Tier · Incremental
// Plus pro Monat eine Zeile (DESC).
// Pre-Maerz-Disclaimer: User-Decision · neue Metriken erst ab Maerz.

import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

interface MonthRow {
  period_month: string;
  activity_revenue_usd: number | null;
  tier_revenue_usd: number | null;
  incremental_revenue_usd: number | null;
  total_revenue_usd: number | null;
  forecast_revenue_usd: number | null;
  forecast_diamonds: number | null;
  missing_diamonds: number | null;
  missing_next_tier_label: string | null;
  missing_status: string | null;
  synced_at: string | null;
  // V12.8 Legacy (Pre-Maerz)
  legacy_revenue_usd: number | null;
  legacy_activity_usd: number | null;
  legacy_incremental_usd: number | null;
  legacy_beginner_bonus_usd: number | null;
  legacy_program_label: string | null;
}

function sr() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function fmtUsd(n: number | null): string {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} $`;
}
function fmtBigInt(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(".", ",")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("de-DE");
}
function fmtMonthLong(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}
function statusBadge(s: string | null): { label: string; cls: string } {
  if (s === "reached")  return { label: "reached",  cls: "bg-champagne/20 text-champagne border border-champagne/50" };
  if (s === "near")     return { label: "near",     cls: "border border-champagne/40 text-champagne/85" };
  if (s === "critical") return { label: "critical", cls: "border border-red-400/50 text-red-300/90" };
  return { label: "—", cls: "border border-cream/15 text-cream/35" };
}

// Pre-Maerz-Cutoff: User-Decision (Backstage hatte vorher andere Metriken).
const NEW_METRICS_CUTOFF = "2026-03-01";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function CreatorRevenueHistoryPage({ params }: PageProps) {
  const { profile } = await requireAdmin();
  const { handle } = await params;
  const normalized = decodeURIComponent(handle).toLowerCase();

  const db = sr();
  const { data: metrics } = await db
    .from("creator_revenue_metrics")
    .select(
      "period_month, activity_revenue_usd, tier_revenue_usd, incremental_revenue_usd, total_revenue_usd, forecast_revenue_usd, forecast_diamonds, missing_diamonds, missing_next_tier_label, missing_status, synced_at, tiktok_username, legacy_revenue_usd, legacy_activity_usd, legacy_incremental_usd, legacy_beginner_bonus_usd, legacy_program_label",
    )
    .eq("tiktok_handle_normalized", normalized)
    .order("period_month", { ascending: false });

  const rows: MonthRow[] = (metrics ?? []).map((m) => ({
    period_month: m.period_month,
    activity_revenue_usd:    m.activity_revenue_usd,
    tier_revenue_usd:        m.tier_revenue_usd,
    incremental_revenue_usd: m.incremental_revenue_usd,
    total_revenue_usd:       m.total_revenue_usd,
    forecast_revenue_usd:    m.forecast_revenue_usd,
    forecast_diamonds:       m.forecast_diamonds,
    missing_diamonds:        m.missing_diamonds,
    missing_next_tier_label: m.missing_next_tier_label,
    missing_status:          m.missing_status,
    synced_at:               m.synced_at,
    legacy_revenue_usd:        m.legacy_revenue_usd,
    legacy_activity_usd:       m.legacy_activity_usd,
    legacy_incremental_usd:    m.legacy_incremental_usd,
    legacy_beginner_bonus_usd: m.legacy_beginner_bonus_usd,
    legacy_program_label:      m.legacy_program_label,
  }));
  const username = metrics?.[0]?.tiktok_username ?? normalized;

  // Profile-Lookup fuer Display-Name
  const { data: pData } = await db
    .from("profiles").select("display_name").eq("tiktok_handle_normalized", normalized).maybeSingle();
  const displayName = pData?.display_name ?? null;

  // Aggregation
  const sumTotal = rows.reduce((s, r) => s + (r.total_revenue_usd ?? 0), 0);

  // Bester / letzter Monat
  const bestMonth = [...rows].sort((a, b) => (b.total_revenue_usd ?? 0) - (a.total_revenue_usd ?? 0))[0] ?? null;
  const latestMonth = rows[0] ?? null;

  // Aktueller Monat (fuer Stat-Cards "aktueller Monat")
  const currentIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  })();
  const currentRow = rows.find((r) => r.period_month === currentIso) ?? null;
  const forecastCurrent = currentRow?.forecast_revenue_usd ?? null;

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={true}
        isManager={false}
      />
      <main className="container-luxe py-10 md:py-16">
        {/* Breadcrumb */}
        <a href="/portal/admin/umsatz?tab=creator"
           className="text-cream/55 hover:text-champagne text-[10px] uppercase tracking-[0.25em] inline-block mb-4">
          ← Umsatz · Creator
        </a>

        <div className="mb-8">
          <p className="eyebrow mb-2">Admin · Umsatz · Historie</p>
          <h1 className="heading-display text-cream text-3xl md:text-4xl">
            {displayName || username}
          </h1>
          <p className="text-cream/45 text-sm mt-2">@{username} · {rows.length} Monate</p>
        </div>

        {rows.length === 0 ? (
          <div className="border border-champagne/15 p-7 text-center">
            <p className="text-cream/55">Noch keine Umsatz-Daten fuer diesen Creator.</p>
          </div>
        ) : (
          <>
            {/* ============= Stat-Cards · Reihenfolge: Gesamt → Forecast → aktueller Monat ============= */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
              <StatCard label="Gesamt Umsatz" value={fmtUsd(sumTotal)} highlight />
              <StatCard label="Forecast Umsatz" value={fmtUsd(forecastCurrent)} highlight />
              <StatCard label="Total Revenue aktueller Monat" value={fmtUsd(currentRow?.total_revenue_usd ?? null)} />
              <StatCard label="Activity Revenue" value={fmtUsd(currentRow?.activity_revenue_usd ?? null)} />
              <StatCard label="Tier Revenue" value={fmtUsd(currentRow?.tier_revenue_usd ?? null)} />
              <StatCard label="Incremental Revenue" value={fmtUsd(currentRow?.incremental_revenue_usd ?? null)} />
              <StatCard
                label="Bester Monat"
                value={bestMonth ? `${fmtUsd(bestMonth.total_revenue_usd)} · ${fmtMonthLong(bestMonth.period_month)}` : "—"}
              />
              <StatCard
                label="Letzter Sync"
                value={latestMonth?.synced_at
                  ? new Date(latestMonth.synced_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                  : "—"}
              />
            </div>

            {/* ============= Pre-Maerz-Disclaimer (V12.8) ============= */}
            {rows.some((r) => r.period_month < NEW_METRICS_CUTOFF) && (
              <div className="border border-champagne/25 bg-champagne/[0.05] p-4 mb-6 text-xs text-cream/75 leading-relaxed">
                <div className="text-champagne/90 font-medium mb-1 uppercase tracking-[0.2em] text-[10px]">Legacy-TikTok-Bonusprogramm vor März 2026</div>
                Pre-Maerz nutzte ein anderes Anreiz-System mit drei Cards:
                Aktivitätsaufgabe, Inkrementelle Umsatzaufgabe und Anfänger*innen-Meilenstein-Bonus.
                Diese Werte erscheinen in der „Legacy"-Spalte (Hover zeigt die Aufschluesselung).
                Die neuen Spalten Activity/Tier/Incremental bleiben fuer Pre-Maerz-Monate „n.v."
                weil das jeweilige Anreiz-System damals noch nicht existierte.
              </div>
            )}

            {/* ============= Monats-Tabelle ============= */}
            <div className="overflow-x-auto border border-champagne/15">
              <table className="w-full text-sm">
                <thead className="bg-champagne/5">
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-cream/55">
                    <th className="px-3 py-3">Monat</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-right">Activity</th>
                    <th className="px-3 py-3 text-right">Tier</th>
                    <th className="px-3 py-3 text-right">Incremental</th>
                    <th className="px-3 py-3 text-right">Legacy</th>
                    <th className="px-3 py-3 text-right">Forecast</th>
                    <th className="px-3 py-3 text-right">Forecast Diamonds</th>
                    <th className="px-3 py-3 text-right">Missing Diamonds</th>
                    <th className="px-3 py-3 text-center">Next Tier</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const isPreNew = r.period_month < NEW_METRICS_CUTOFF;
                    const sb = statusBadge(r.missing_status);
                    const naMark = (v: number | null): string =>
                      isPreNew && (v === null || v === undefined) ? "n.v." : fmtUsd(v);
                    const naBigInt = (v: number | null): string =>
                      isPreNew && (v === null || v === undefined) ? "n.v." : fmtBigInt(v);
                    return (
                      <tr key={r.period_month} className="border-t border-champagne/10 hover:bg-champagne/[0.03]">
                        <td className="px-3 py-3 text-cream font-medium">
                          {fmtMonthLong(r.period_month)}
                          {r.legacy_program_label && (
                            <span title={r.legacy_program_label} className="ml-2 text-[9px] uppercase tracking-[0.2em] text-champagne/55 border border-champagne/25 px-1.5 py-0.5">
                              Legacy
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-champagne font-medium">{fmtUsd(r.total_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{naMark(r.activity_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{naMark(r.tier_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{naMark(r.incremental_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/70">
                          {r.legacy_revenue_usd != null ? (
                            <span title={`Aktivitätsaufgabe ${fmtUsd(r.legacy_activity_usd)} + Inkrementelle Umsatzaufgabe ${fmtUsd(r.legacy_incremental_usd)}${r.legacy_beginner_bonus_usd ? ` + Anfänger-Meilenstein ${fmtUsd(r.legacy_beginner_bonus_usd)}` : ''}`}>
                              {fmtUsd(r.legacy_revenue_usd)}
                            </span>
                          ) : isPreNew ? "n.v." : "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-cream/80">{naMark(r.forecast_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{naBigInt(r.forecast_diamonds)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{naBigInt(r.missing_diamonds)}</td>
                        <td className="px-3 py-3 text-center text-cream/85">
                          {isPreNew && !r.missing_next_tier_label ? <span className="text-cream/35">n.v.</span> : (r.missing_next_tier_label || "—")}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isPreNew && !r.missing_status ? (
                            <span className="text-cream/35 text-[10px] uppercase tracking-[0.2em]">n.v.</span>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${sb.cls}`}>
                              {sb.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* HISTORIE-NACHLADE-WORKFLOW · Phase 4
            Webapp (Vercel) kann nicht direkt Workstation-Scraper triggern
            (zwei getrennte Maschinen, keine API zwischen ihnen).
            Pragmatisch: kopierfertiger CLI-Befehl + Workflow-Hinweis.
            User triggert auf Workstation manuell. */}
        <div className="mt-8 border border-champagne/20 p-5">
          <p className="text-cream/85 text-sm mb-3 font-medium">Historie nachladen (manuell)</p>
          <p className="text-cream/55 text-xs leading-relaxed mb-4 max-w-2xl">
            Backstage hat einen Anchor-Detail-Monatsfilter mit ~30-Tage-Window.
            Fuer aeltere Monate auf der Workstation diesen Befehl ausfuehren —
            der Scraper akzeptiert beliebige <code className="text-champagne/85">--month YYYY-MM</code>:
          </p>
          <pre className="bg-black/40 border border-champagne/15 p-3 text-cream/85 text-xs overflow-x-auto leading-relaxed select-all">{`# April 2026 fuer ${normalized}
cd "G:\\Meine Ablage\\ZOE_STAR_AGENCY_WEBAPP\\workstation"
python backstage_revenue_scraper.py --month 2026-04 --only ${normalized} --push-after`}</pre>
          <p className="text-cream/40 text-[10px] mt-3 leading-relaxed">
            Falls Backstage den gewuenschten Monat noch zeigt: Werte werden gepusht,
            inserted ggf. mit <code>force=true</code> wenn der Monat schon existiert.
            Vergangene Monate sind ansonsten frozen (Auto-Sync ueberschreibt sie nicht).
          </p>
        </div>
      </main>
    </>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border p-4 ${highlight ? "border-champagne/40 bg-champagne/5" : "border-champagne/15"}`}>
      <p className="text-cream/45 text-[9px] uppercase tracking-[0.22em] mb-2">{label}</p>
      <p className={`font-display italic text-2xl md:text-3xl leading-tight ${highlight ? "text-champagne" : "text-cream"}`}>
        {value}
      </p>
    </div>
  );
}
