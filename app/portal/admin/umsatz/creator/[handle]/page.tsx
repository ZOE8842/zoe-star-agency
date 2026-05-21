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
import { MobileBackWrapper } from "@/components/mobile/MobileBackWrapper";

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

// V2-A · Compare-Helpers
function comparePct(current: number | null, delta: number | null): number | null {
  if (current === null || delta === null) return null;
  const before = current - delta;
  if (!Number.isFinite(before) || before === 0) return null;
  return Math.round((delta / before) * 1000) / 10;
}
function compareColor(value: number | null): string {
  if (value === null) return "text-cream/45";
  if (value > 0.1) return "text-emerald-400/85";
  if (value < -0.1) return "text-red-400/85";
  return "text-cream/55";
}
function compareArrow(value: number | null): string {
  if (value === null) return "—";
  if (value > 0.1) return "↑";
  if (value < -0.1) return "↓";
  return "·";
}
function fmtUsd2(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
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
  const currentMonthIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  })();

  const [
    { data: metrics },
    { data: summary },
    { data: compute },
  ] = await Promise.all([
    db
      .from("creator_revenue_metrics")
      .select(
        "period_month, activity_revenue_usd, tier_revenue_usd, incremental_revenue_usd, total_revenue_usd, forecast_revenue_usd, forecast_diamonds, missing_diamonds, missing_next_tier_label, missing_status, synced_at, tiktok_username, legacy_revenue_usd, legacy_activity_usd, legacy_incremental_usd, legacy_beginner_bonus_usd, legacy_program_label",
      )
      .eq("tiktok_handle_normalized", normalized)
      .order("period_month", { ascending: false }),
    db
      .from("v_creator_incentive_summary")
      .select("ist_estimated_bonus_usd, ist_activity_usd, ist_tier_usd, ist_incremental_usd, ist_tier_level, ist_activity_level, ist_activity_ratio, ist_tier_progress, ist_tier_target, ist_forecast_revenue_usd, live_current_diamonds, live_valid_days, live_duration_seconds, live_streams_count, live_new_followers, live_diamonds_compare, live_days_compare, live_duration_compare_sec, live_streams_compare, live_followers_compare, live_compare_start, live_compare_end, meta_invitation_type, meta_is_new_creator, meta_last_live_at")
      .eq("tiktok_handle_normalized", normalized)
      .eq("period_month", currentMonthIso)
      .maybeSingle(),
    db
      .from("v_creator_incentive_compute")
      .select("days_to_next_activity_level, max_diamonds_to_next_tier, real_projected_bonus_usd_eom, trend_class, hist_3m_avg_total, hist_3m_count, month_day, month_days_total, month_days_remaining")
      .eq("tiktok_handle_normalized", normalized)
      .eq("period_month", currentMonthIso)
      .maybeSingle(),
  ]);

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

  // V2-A · Eligibility-Berechnung (TikTok ≥7 LIVE-Tage + ≥15h)
  const liveDays = Number(summary?.live_valid_days ?? 0);
  const liveSecs = Number(summary?.live_duration_seconds ?? 0);
  const daysMissing = Math.max(0, 7 - liveDays);
  const hoursMissing = Math.ceil(Math.max(0, 15 * 3600 - liveSecs) / 3600);
  const isEligible = daysMissing === 0 && hoursMissing === 0;
  const istZero = Number(summary?.ist_estimated_bonus_usd ?? 0) === 0;
  const showEligibilityWarn = istZero
    && (Number(summary?.live_current_diamonds ?? 0) > 100_000)
    && !isEligible;

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
      <main className="container-luxe py-6 md:py-16">
        {/* Mobile · großer Back-Button + Edge-Swipe (Wrapper) */}
        <MobileBackWrapper fallbackHref="/portal/admin" label="Zurück zu Master">
        {/* Desktop · klassisches kleines Breadcrumb */}
        <a href="/portal/admin"
           className="hidden md:inline-block text-cream/55 hover:text-champagne text-[10px] uppercase tracking-[0.25em] mb-4">
          ← Master
        </a>

        <div className="mb-8">
          <p className="eyebrow mb-2">Admin · Umsatz · Historie</p>
          <h1 className="heading-display text-cream text-3xl md:text-4xl">
            {displayName || username}
          </h1>
          <p className="text-cream/45 text-sm mt-2">@{username} · {rows.length} Monate</p>
        </div>

        {/* ═══ V2-A · Top-Block (aktueller Monat) ═══ */}
        {summary && (
          <>
            {/* Eligibility-Warnung */}
            {showEligibilityWarn && (
              <div className="border border-champagne/40 bg-champagne/[0.04] p-4 md:p-5 mb-5">
                <p className="text-champagne text-xs font-medium uppercase tracking-[0.18em] mb-2">▴ Noch nicht teilnahmeberechtigt</p>
                <p className="text-cream/85 text-sm leading-relaxed mb-2">
                  Aktuell {fmtUsd2(summary.ist_estimated_bonus_usd)} Tier-Bonus, weil die TikTok-Mindestaktivität noch nicht erfüllt ist.
                  Es fehlen
                  {daysMissing > 0 && <span className="text-champagne/85"> {daysMissing} gültige LIVE-Tag{daysMissing === 1 ? "" : "e"}</span>}
                  {daysMissing > 0 && hoursMissing > 0 && " und "}
                  {hoursMissing > 0 && <span className="text-champagne/85">{hoursMissing} LIVE-Stunde{hoursMissing === 1 ? "" : "n"}</span>}.
                </p>
                {summary.ist_forecast_revenue_usd !== null && Number(summary.ist_forecast_revenue_usd) > 0 && (
                  <p className="text-cream/55 text-xs">
                    Sobald erreicht: TikTok-Forecast <span className="text-champagne/85">{fmtUsd2(summary.ist_forecast_revenue_usd)}</span>
                  </p>
                )}
              </div>
            )}

            {/* IST + Hochrechnung */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-5">
              <div className="border border-champagne/25 p-4 md:p-5">
                <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-2">Aktuell · {fmtMonthLong(currentMonthIso).split(" ")[0]}</p>
                <p className="font-display italic text-3xl text-champagne leading-none">
                  {fmtUsd2(summary.ist_estimated_bonus_usd)}
                </p>
                <p className="text-cream/40 text-[10px] mt-2">Tag {compute?.month_day ?? "?"} / {compute?.month_days_total ?? "?"}</p>
              </div>
              <div className="border border-champagne/15 p-4 md:p-5">
                <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-2">Hochrechnung Monatsende</p>
                <p className="font-display italic text-3xl text-cream leading-none">
                  {fmtUsd2(compute?.real_projected_bonus_usd_eom)}
                </p>
                <p className="text-cream/40 text-[10px] mt-2">bei gleichbleibender Pace</p>
              </div>
            </div>

            {/* 3-Anreiz-Block · konkret was fehlt */}
            <div className="space-y-3 mb-6">
              <div className="border border-champagne/15 p-4 md:p-5">
                <p className="text-cream/55 text-[10px] uppercase tracking-[0.22em] mb-2">Aktivitätsanreiz</p>
                <p className="text-cream text-base leading-snug font-medium">
                  {(() => {
                    const lvl = summary.ist_activity_level ?? null;
                    const next = lvl !== null ? lvl + 1 : null;
                    const dn = compute?.days_to_next_activity_level ?? null;
                    if (lvl === null) return "Activity-Level unbekannt";
                    if (lvl >= 5) return "Level 5 erreicht · Maximum";
                    if (dn === null) return `Level ${lvl} · Ziel: Level ${next}`;
                    if (dn === 0) return `Schwelle erreicht · wartet auf TikTok-Update`;
                    return `Für Level ${next} fehlen noch ${dn} gültige LIVE-Tag${dn === 1 ? "" : "e"}`;
                  })()}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div>
                    <p className="text-cream/40 text-[9px] uppercase tracking-[0.18em] mb-1">LIVE-Tage</p>
                    <p className="text-cream/85">{summary.live_valid_days ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-cream/40 text-[9px] uppercase tracking-[0.18em] mb-1">Bonusverhältnis</p>
                    <p className="text-cream/85">
                      {summary.ist_activity_ratio !== null && summary.ist_activity_ratio !== undefined
                        ? `${(Number(summary.ist_activity_ratio) * 100).toFixed(1).replace(".", ",")} %`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-champagne/15 p-4 md:p-5">
                <p className="text-cream/55 text-[10px] uppercase tracking-[0.22em] mb-2">Stufenbasierter Umsatzanreiz</p>
                <p className="text-cream text-base leading-snug font-medium">
                  {(() => {
                    const stf = summary.ist_tier_level ?? null;
                    const nx = stf !== null ? stf + 1 : null;
                    const dm = compute?.max_diamonds_to_next_tier ?? null;
                    if (stf === null) return "Stufe unbekannt";
                    if (dm === null || dm === 0) return `Stufe ${stf} erreicht · TikTok-Update wartet`;
                    return `Noch ${fmtBigInt(dm)} Diamanten bis Stufe ${nx}`;
                  })()}
                </p>
                {summary.ist_tier_progress !== null && summary.ist_tier_target !== null && (
                  <>
                    <div className="flex items-baseline justify-between mt-3 mb-1.5 text-xs">
                      <p className="text-cream/45">Fortschritt</p>
                      <p className="text-cream/75">
                        {fmtBigInt(summary.ist_tier_progress)} / {fmtBigInt(summary.ist_tier_target)}
                      </p>
                    </div>
                    <div className="h-1 bg-champagne/10 overflow-hidden">
                      <div
                        className="h-full bg-champagne/60"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((Number(summary.ist_tier_progress) || 0) / Math.max(1, Number(summary.ist_tier_target) || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="border border-champagne/15 p-4 md:p-5">
                <p className="text-cream/55 text-[10px] uppercase tracking-[0.22em] mb-2">Inkrementeller Umsatzanreiz</p>
                <p className="text-cream text-base leading-snug font-medium">
                  {(() => {
                    const inc = Number(summary.ist_incremental_usd ?? 0);
                    if (inc > 0) return `Aktiv · ${fmtUsd2(inc)} in diesem Monat`;
                    return "Pausiert · Netzwerkziel aktuell nicht erreicht";
                  })()}
                </p>
                <p className="text-cream/45 text-[10px] mt-2 leading-relaxed">
                  Netzwerk-Hebel · TikTok zeigt keinen individuellen Schwellenwert
                </p>
              </div>
            </div>

            {/* LIVE-Performance Compare */}
            {summary.live_compare_start && (
              <div className="border border-champagne/15 p-4 md:p-5 mb-6">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="text-cream/55 text-[10px] uppercase tracking-[0.22em]">LIVE-Performance</p>
                  <p className="text-cream/40 text-[10px]">
                    vs. {new Date(summary.live_compare_start).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                    {" – "}
                    {summary.live_compare_end ? new Date(summary.live_compare_end).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : "?"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "LIVE-Tage", curr: summary.live_valid_days, delta: summary.live_days_compare, fmt: (v: number | null) => v?.toString() ?? "—" },
                    { label: "LIVE-Dauer", curr: summary.live_duration_seconds, delta: summary.live_duration_compare_sec, fmt: (v: number | null) => v !== null ? `${Math.floor(v / 3600)}h ${Math.floor((v % 3600) / 60)}m` : "—" },
                    { label: "Streams", curr: summary.live_streams_count, delta: summary.live_streams_compare, fmt: (v: number | null) => v?.toString() ?? "—" },
                    { label: "Neue Follower", curr: summary.live_new_followers, delta: summary.live_followers_compare, fmt: (v: number | null) => v?.toString() ?? "—" },
                  ].map((item) => {
                    const pct = comparePct(item.curr, item.delta);
                    return (
                      <div key={item.label}>
                        <p className="text-cream/40 text-[9px] uppercase tracking-[0.18em] mb-1">{item.label}</p>
                        <p className="text-cream/85 text-sm">{item.fmt(item.curr)}</p>
                        {pct !== null && (
                          <p className={`text-[10px] mt-0.5 ${compareColor(pct)}`}>
                            {compareArrow(pct)} {pct > 0 ? "+" : ""}{pct.toFixed(1).replace(".", ",")} %
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trend */}
            {compute?.trend_class && (
              <div className="border border-champagne/15 p-4 md:p-5 mb-8">
                <p className="text-cream/55 text-[10px] uppercase tracking-[0.22em] mb-2">Trend vs. 3-Monats-Schnitt</p>
                <p className={`text-base font-medium ${
                  compute.trend_class === "wachsend" ? "text-emerald-400/85"
                  : compute.trend_class === "fallend" ? "text-red-400/70"
                  : "text-cream/75"
                }`}>
                  {compute.trend_class === "wachsend" ? "↑ über persönlichem Schnitt"
                    : compute.trend_class === "fallend" ? "↓ unter persönlichem Schnitt"
                    : compute.trend_class === "stabil" ? "· im persönlichen Schnitt"
                    : compute.trend_class === "new_creator" ? "Noch zu wenig Historie"
                    : "—"}
                </p>
                {compute.hist_3m_avg_total !== null && compute.hist_3m_count !== null && Number(compute.hist_3m_count) >= 2 && (
                  <p className="text-cream/45 text-xs mt-1">
                    3-Monats-Schnitt: {fmtUsd2(compute.hist_3m_avg_total)} ({compute.hist_3m_count} Monate)
                  </p>
                )}
              </div>
            )}
          </>
        )}

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
        </MobileBackWrapper>
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
