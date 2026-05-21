// /portal/admin/umsatz · Admin-only Umsatz-Modul (V12 · Phase 1)
//
// SCOPE: NUR Admin. requireAdmin → Manager/Creator redirect zu /portal.
// QUELLE: creator_revenue_metrics (Migration 0048, handle-keyed).
// PRESENT: 3 Sub-Tabs · Current · Forecast · Missing
// EMPTY-STATE bis Workstation-Scraper Phase 2 die Daten liefert.

import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

type SubTab = "overview" | "current" | "forecast" | "missing" | "creator";

// Phase B2 · Compute-View-Row · v_creator_incentive_compute
interface ComputeRow {
  tiktok_username: string;
  ist_estimated_bonus_usd: number | null;
  ist_activity_usd: number | null;
  ist_tier_usd: number | null;
  ist_incremental_usd: number | null;
  ist_tier_level: number | null;
  ist_activity_level: number | null;
  ist_activity_ratio: number | null;
  ist_tier_status: string | null;
  ist_activity_status: string | null;
  ist_incremental_status: string | null;
  live_current_diamonds: number | null;
  live_valid_days: number | null;
  live_duration_seconds: number | null;
  live_streams_count: number | null;
  live_new_followers: number | null;
  data_completeness: "sot_live" | "legacy_only" | "pre_maerz_only" | "empty";
  drift_pct: number | null;
  meta_invitation_type: "Regulär" | "Premium" | "Elite" | null;
  meta_is_new_creator: boolean | null;
  month_day: number | null;
  month_days_total: number | null;
  month_days_remaining: number | null;
  real_projected_bonus_usd_eom: number | null;
  real_projected_diamonds_eom: number | null;
  max_diamonds_to_next_tier: number | null;
  days_to_next_activity_level: number | null;
  hist_3m_avg_total: number | null;
  hist_3m_count: number | null;
  trend_class: "wachsend" | "stabil" | "fallend" | "new_creator" | "unknown" | null;
}

interface CreatorAggRow {
  tiktok_username: string;
  display_name: string | null;
  total_sum_usd: number;          // lifetime SUM (Gesamt Umsatz)
  current_total_usd: number | null;        // Total Revenue · aktueller Monat
  current_activity_usd: number | null;     // Activity Revenue · aktueller Monat
  current_tier_usd: number | null;         // Tier Revenue · aktueller Monat
  current_incremental_usd: number | null;  // Incremental Revenue · aktueller Monat
  forecast_current_usd: number | null;
  months_count: number;
  last_sync: string | null;
}

interface Row {
  profile_id: string | null;
  tiktok_username: string;
  display_name: string | null;
  period_month: string;
  // current
  activity_revenue_usd: number | null;
  tier_revenue_usd: number | null;
  incremental_revenue_usd: number | null;
  total_revenue_usd: number | null;
  last_period_total_usd: number | null;
  // forecast
  forecast_revenue_usd: number | null;
  forecast_diamonds: number | null;
  forecast_bonus_usd: number | null;
  // missing
  missing_revenue_usd: number | null;
  missing_diamonds: number | null;
  missing_next_tier_label: string | null;
  missing_status: string | null;
}

function sr() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function currentMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
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
function fmtPct(curr: number | null, prev: number | null): string {
  if (curr === null || prev === null || prev === 0) return "—";
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}
function fmtPctClass(curr: number | null, prev: number | null): string {
  if (curr === null || prev === null || prev === 0) return "text-cream/40";
  const pct = ((curr - prev) / prev) * 100;
  if (pct >= 50)  return "text-champagne";
  if (pct >= 0)   return "text-champagne/80";
  if (pct >= -25) return "text-cream/55";
  return "text-red-300/85";
}

function statusBadge(s: string | null): { label: string; cls: string } {
  if (s === "reached")  return { label: "reached",  cls: "bg-champagne/20 text-champagne border border-champagne/50" };
  if (s === "near")     return { label: "near",     cls: "border border-champagne/40 text-champagne/85" };
  if (s === "critical") return { label: "critical", cls: "border border-red-400/50 text-red-300/90" };
  return { label: "—", cls: "border border-cream/15 text-cream/35" };
}

interface PageProps {
  searchParams: Promise<{ tab?: string; expand?: string }>;
}

// V1.4 · Detail-Row-Type · ergänzt aus v_creator_incentive_summary
interface ExpandedDetail {
  tiktok_username: string;
  meta_last_live_at: string | null;
  live_diamonds_compare: number | null;
  live_days_compare: number | null;
  live_days_compare_pct: number | null;
  live_duration_compare_sec: number | null;
  live_duration_compare_pct: number | null;
  live_streams_compare: number | null;
  live_streams_compare_pct: number | null;
  live_followers_compare: number | null;
  live_followers_compare_pct: number | null;
  live_avg_watch: number | null;
  live_compare_start: string | null;
  live_compare_end: string | null;
  ist_tier_progress: number | null;
  ist_tier_target: number | null;
  ist_match_diamonds: number | null;
  ist_forecast_revenue_usd: number | null;
  ist_forecast_diamonds: number | null;
  meta_mgmt_start: string | null;
  meta_mgmt_end: string | null;
}

export default async function AdminUmsatzPage({ searchParams }: PageProps) {
  const { profile } = await requireAdmin();
  const { loadLocale } = await import("@/lib/i18n");
  const { t } = await loadLocale();
  const sp = await searchParams;
  const tab: SubTab =
    sp.tab === "overview" ? "overview" :
    sp.tab === "forecast" ? "forecast" :
    sp.tab === "missing"  ? "missing"  :
    sp.tab === "creator"  ? "creator"  :
    sp.tab === "current"  ? "current"  : "overview";  // Default ab v1.18: overview

  // V1.4 · expand parameter (normalized handle)
  const expandHandle = (sp.expand ?? "").trim().toLowerCase().replace(/^@/, "");

  const db = sr();
  const month = currentMonthIso();

  // Fuer Creator-Tab brauchen wir ALLE Perioden, fuer andere nur den aktuellen Monat
  const baseQuery = db
    .from("creator_revenue_metrics")
    .select(
      "profile_id, tiktok_username, tiktok_handle_normalized, period_month, activity_revenue_usd, tier_revenue_usd, incremental_revenue_usd, total_revenue_usd, last_period_total_usd, forecast_revenue_usd, forecast_diamonds, forecast_bonus_usd, missing_revenue_usd, missing_diamonds, missing_next_tier_label, missing_status, synced_at",
    );
  const { data: metrics } = tab === "creator"
    ? await baseQuery
    : await baseQuery.eq("period_month", month);

  const handles = (metrics ?? []).map((m) => m.tiktok_handle_normalized);
  const { data: profiles } = handles.length > 0
    ? await db.from("profiles").select("id, tiktok_handle_normalized, display_name")
        .in("tiktok_handle_normalized", handles)
    : { data: [] };
  const nameByHandle = new Map((profiles ?? []).map((p) => [p.tiktok_handle_normalized, p.display_name]));

  // Phase B2 Compute-View · für overview + creator-Tab-Enhancement.
  // Lädt aktuellen Monat sot_live-Rows mit Pace / Trend / Quick-Win-Daten.
  const { data: computeRows } = (tab === "overview" || tab === "creator")
    ? await db
        .from("v_creator_incentive_compute")
        .select("tiktok_username, ist_estimated_bonus_usd, ist_activity_usd, ist_tier_usd, ist_incremental_usd, ist_tier_level, ist_activity_level, ist_activity_ratio, ist_tier_status, ist_activity_status, ist_incremental_status, live_current_diamonds, live_valid_days, live_duration_seconds, live_streams_count, live_new_followers, data_completeness, drift_pct, meta_invitation_type, meta_is_new_creator, month_day, month_days_total, month_days_remaining, real_projected_bonus_usd_eom, real_projected_diamonds_eom, max_diamonds_to_next_tier, days_to_next_activity_level, hist_3m_avg_total, hist_3m_count, trend_class")
        .eq("period_month", month)
        .order("ist_estimated_bonus_usd", { ascending: false, nullsFirst: false })
    : { data: [] };
  const compute: ComputeRow[] = (computeRows ?? []) as unknown as ComputeRow[];
  const computeByHandle = new Map<string, ComputeRow>();
  for (const c of compute) computeByHandle.set(c.tiktok_username.toLowerCase(), c);

  // V1.4 · Detail-Fetch für ausgeklappten Creator (nur 1 Row)
  const { data: expandedDetailRow } = (tab === "overview" && expandHandle)
    ? await db
        .from("v_creator_incentive_summary")
        .select("tiktok_username, meta_last_live_at, live_diamonds_compare, live_days_compare, live_days_compare_pct, live_duration_compare_sec, live_duration_compare_pct, live_streams_compare, live_streams_compare_pct, live_followers_compare, live_followers_compare_pct, live_avg_watch, live_compare_start, live_compare_end, ist_tier_progress, ist_tier_target, ist_match_diamonds, ist_forecast_revenue_usd, ist_forecast_diamonds, meta_mgmt_start, meta_mgmt_end")
        .eq("tiktok_handle_normalized", expandHandle)
        .eq("period_month", month)
        .maybeSingle()
    : { data: null };
  const expandedDetail: ExpandedDetail | null = expandedDetailRow
    ? (expandedDetailRow as unknown as ExpandedDetail)
    : null;

  const rows: Row[] = (metrics ?? []).map((m) => ({
    profile_id: m.profile_id,
    tiktok_username: m.tiktok_username ?? "",
    display_name: nameByHandle.get(m.tiktok_handle_normalized) ?? null,
    period_month: m.period_month,
    activity_revenue_usd:    m.activity_revenue_usd,
    tier_revenue_usd:        m.tier_revenue_usd,
    incremental_revenue_usd: m.incremental_revenue_usd,
    total_revenue_usd:       m.total_revenue_usd,
    last_period_total_usd:   m.last_period_total_usd,
    forecast_revenue_usd:    m.forecast_revenue_usd,
    forecast_diamonds:       m.forecast_diamonds,
    forecast_bonus_usd:      m.forecast_bonus_usd,
    missing_revenue_usd:     m.missing_revenue_usd,
    missing_diamonds:        m.missing_diamonds,
    missing_next_tier_label: m.missing_next_tier_label,
    missing_status:          m.missing_status,
  }));

  // Tab-spezifische Sortierung
  if (tab === "current") {
    rows.sort((a, b) => (b.total_revenue_usd ?? 0) - (a.total_revenue_usd ?? 0));
  } else if (tab === "forecast") {
    rows.sort((a, b) => (b.forecast_revenue_usd ?? 0) - (a.forecast_revenue_usd ?? 0));
  } else if (tab === "missing") {
    const rank = (s: string | null): number =>
      s === "reached" ? 0 : s === "near" ? 1 : s === "critical" ? 2 : 3;
    rows.sort((a, b) => {
      const r = rank(a.missing_status) - rank(b.missing_status);
      if (r !== 0) return r;
      return (b.missing_revenue_usd ?? 0) - (a.missing_revenue_usd ?? 0);
    });
  }
  // tab === "creator" wird unten aggregiert (eigene Render-Logik)

  // ============= CREATOR-AGGREGATION =============
  // Gruppiert pro handle ueber ALLE Perioden. Sum-Felder + months_count + last_sync.
  // forecast_current_usd = forecast aus Row mit period_month == aktueller Monat.
  let creatorAgg: CreatorAggRow[] = [];
  if (tab === "creator") {
    const groups = new Map<string, {
      tiktok_username: string;
      display_name: string | null;
      total_sum: number;
      months: Set<string>;
      current_total: number | null;
      current_activity: number | null;
      current_tier: number | null;
      current_incr: number | null;
      forecast_current: number | null;
      last_sync: string | null;
    }>();
    for (const r of rows) {
      const key = r.tiktok_username.toLowerCase();
      let g = groups.get(key);
      if (!g) {
        g = {
          tiktok_username: r.tiktok_username,
          display_name: r.display_name,
          total_sum: 0,
          months: new Set(),
          current_total: null,
          current_activity: null,
          current_tier: null,
          current_incr: null,
          forecast_current: null,
          last_sync: null,
        };
        groups.set(key, g);
      }
      const total = r.total_revenue_usd ??
        ((r.activity_revenue_usd ?? 0) + (r.tier_revenue_usd ?? 0) + (r.incremental_revenue_usd ?? 0));
      g.total_sum += total;
      g.months.add(r.period_month);
      if (r.period_month === month) {
        g.current_total      = r.total_revenue_usd;
        g.current_activity   = r.activity_revenue_usd;
        g.current_tier       = r.tier_revenue_usd;
        g.current_incr       = r.incremental_revenue_usd;
        g.forecast_current   = r.forecast_revenue_usd;
      }
    }
    // last_sync per handle: max synced_at aus metrics
    if (metrics) {
      const maxByHandle = new Map<string, string>();
      for (const m of metrics) {
        const key = (m.tiktok_username ?? "").toLowerCase();
        const cur = maxByHandle.get(key);
        const s = (m as { synced_at?: string }).synced_at ?? "";
        if (s && (!cur || s > cur)) maxByHandle.set(key, s);
      }
      for (const [key, g] of groups) {
        g.last_sync = maxByHandle.get(key) ?? null;
      }
    }
    creatorAgg = [...groups.values()].map((g) => ({
      tiktok_username: g.tiktok_username,
      display_name: g.display_name,
      total_sum_usd: g.total_sum,
      current_total_usd:       g.current_total,
      current_activity_usd:    g.current_activity,
      current_tier_usd:        g.current_tier,
      current_incremental_usd: g.current_incr,
      forecast_current_usd:    g.forecast_current,
      months_count:            g.months.size,
      last_sync:               g.last_sync,
    }));
    creatorAgg.sort((a, b) => b.total_sum_usd - a.total_sum_usd);
  }

  const monthLabel = new Date(month).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const sumActivity = rows.reduce((s, r) => s + (r.activity_revenue_usd ?? 0), 0);
  const sumTier     = rows.reduce((s, r) => s + (r.tier_revenue_usd ?? 0), 0);
  const sumIncr     = rows.reduce((s, r) => s + (r.incremental_revenue_usd ?? 0), 0);
  const sumTotal    = rows.reduce((s, r) => s + (r.total_revenue_usd ?? 0), 0);
  const sumForecast = rows.reduce((s, r) => s + (r.forecast_revenue_usd ?? 0), 0);

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
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow mb-2">Admin · {t("nav.umsatz")}</p>
            <h1 className="heading-display text-cream text-3xl md:text-4xl">
              {t("nav.umsatz")} · {monthLabel}
            </h1>
            <p className="text-cream/50 text-sm mt-2">
              {rows.length} Creator · Total Revenue {fmtUsd(sumTotal)} ·
              Forecast {fmtUsd(sumForecast)}
            </p>
          </div>
        </div>

        {/* SUB-TABS · v1.20: deutsche Hauptlabels, TikTok-Begriff sekundär */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5 md:flex md:flex-wrap md:gap-2 mb-6 md:mb-5 border-b border-champagne/15 pb-3">
          {(["overview","current","forecast","missing","creator"] as const).map((t) => {
            const active = t === tab;
            const label = t === "overview" ? "Übersicht"
                        : t === "current"  ? "Aktuell"
                        : t === "forecast" ? "Prognose"
                        : t === "missing"  ? "Fehlt"
                        : "Pro Creator";
            return (
              <a key={t} href={`?tab=${t}`}
                 className={[
                   "text-[10px] md:text-[11px] uppercase tracking-[0.2em] px-3 py-2 min-h-[44px]",
                   "inline-flex items-center justify-center text-center transition-all",
                   active
                     ? "bg-champagne text-ink border border-champagne"
                     : "border border-champagne/30 text-cream/70 hover:border-champagne hover:text-champagne",
                 ].join(" ")}>
                {label}
              </a>
            );
          })}
        </div>

        {/* BESCHREIBUNG */}
        <div className="mb-5 border-l-2 border-champagne/40 pl-4">
          {tab === "overview" && (
            <>
              <p className="text-cream/85 text-sm mb-3">
                Wo steht das Netzwerk heute · wie würde es bei aktueller Pace landen · wer ist kurz vor dem Aufstieg?
              </p>
              <p className="text-cream/55 text-xs leading-relaxed">
                Aktueller Stand · Hochrechnung bei gleichbleibendem Tempo · Vergleich gegen 3-Monats-Schnitt · Push-Kandidaten.
                Deterministisch berechnet — keine TikTok-Prognose, sondern operative Schätzung.
              </p>
            </>
          )}
          {tab === "current" && (
            <>
              <p className="text-cream/85 text-sm mb-3">
                Was bringt jeder Creator aktuell wirklich ein?
              </p>
              <p className="text-cream/55 text-xs leading-relaxed">
                Activity · Tier · Incremental · Total · Vergleich zum gleichen Zeitraum letzten Monats.
                Werte aus Backstage Anreize-Pages (Activity, Tier, Incremental).
              </p>
            </>
          )}
          {tab === "forecast" && (
            <>
              <p className="text-cream/85 text-sm mb-3">
                Was erwartet TikTok bis Monatsende?
              </p>
              <p className="text-cream/55 text-xs leading-relaxed">
                Forecast-Werte direkt aus Backstage. Spaeter: Monatsvergleich Mai vs April.
              </p>
            </>
          )}
          {tab === "missing" && (
            <>
              <p className="text-cream/85 text-sm mb-3">
                Was fehlt noch bis Ziel / Forecast / naechste Stufe?
              </p>
              <p className="text-cream/55 text-xs leading-relaxed">
                Near / Critical / Reached. Sortierung: erreichbar zuerst, kritisch unten.
              </p>
            </>
          )}
          {tab === "creator" && (
            <>
              <p className="text-cream/85 text-sm mb-3">
                Wer hat seit Backstage-Start am meisten eingebracht?
              </p>
              <p className="text-cream/55 text-xs leading-relaxed">
                Aggregiert ueber alle vorhandenen Monate. Sortierung nach Gesamtumsatz DESC.
                Klick auf Creator-Zeile oeffnet die Monats-Historie.
              </p>
            </>
          )}
        </div>

        {/* ============= OVERVIEW-TAB (Phase B2 · Compute-View) ============= */}
        {tab === "overview" && (() => {
          // V1.6 · Tier-Bonus-Eligibility (TikTok-Mindestanforderung)
          //   ≥7 gültige LIVE-Tage UND ≥15h (54.000 s) LIVE-Dauer
          // Wenn nicht erfüllt: TikTok zahlt $0 Tier-Bonus trotz vieler Diamonds.
          const TIER_MIN_DAYS = 7;
          const TIER_MIN_SECONDS = 15 * 3600;
          const getEligibility = (c: ComputeRow) => {
            const days = c.live_valid_days;
            const secs = c.live_duration_seconds;
            if (days === null || secs === null) {
              return { eligible: false, daysMissing: 0, hoursMissing: 0, dataKnown: false };
            }
            const daysMissing = Math.max(0, TIER_MIN_DAYS - days);
            const secsMissing = Math.max(0, TIER_MIN_SECONDS - secs);
            const hoursMissing = Math.ceil(secsMissing / 3600);
            return {
              eligible: daysMissing === 0 && secsMissing === 0,
              daysMissing,
              hoursMissing,
              dataKnown: true,
            };
          };

          // V1.5 · Priority-Sort. Erweitert um Prio 0 = Eligibility nahe
          // (≤1 Tag oder ≤1h fehlt — sehr operativ relevant, weil Bonus
          // sonst gar nicht auszahlt).
          const computePriority = (c: ComputeRow): number => {
            const elig = getEligibility(c);
            // Prio 0: Eligibility fast erreicht UND aktuell noch $0
            if (!elig.eligible && elig.dataKnown
                && (elig.daysMissing <= 1 && elig.hoursMissing <= 1)
                && (Number(c.ist_estimated_bonus_usd) || 0) === 0
                && (Number(c.live_current_diamonds) || 0) > 100_000) {
              return 0;
            }
            const dn = c.days_to_next_activity_level;
            const dm = c.max_diamonds_to_next_tier;
            if (dn !== null && dn <= 1 && (c.ist_activity_level ?? 0) < 5) return 1;
            if (dm !== null && dm > 0 && dm <= 50_000) return 2;
            if (c.trend_class === "wachsend") return 3;
            return 4;
          };
          const sotLiveAll = compute.filter((c) => c.data_completeness === "sot_live");
          const sotLive = [...sotLiveAll].sort((a, b) => {
            const pa = computePriority(a);
            const pb = computePriority(b);
            if (pa !== pb) return pa - pb;
            return (Number(b.real_projected_bonus_usd_eom) || 0)
                 - (Number(a.real_projected_bonus_usd_eom) || 0);
          });
          const sumIst   = sotLive.reduce((s, c) => s + (Number(c.ist_estimated_bonus_usd) || 0), 0);
          const sumReal  = sotLive.reduce((s, c) => s + (Number(c.real_projected_bonus_usd_eom) || 0), 0);
          const cntWachsend = sotLive.filter((c) => c.trend_class === "wachsend").length;
          const cntFallend  = sotLive.filter((c) => c.trend_class === "fallend").length;
          const cntStabil   = sotLive.filter((c) => c.trend_class === "stabil").length;
          const cntNew      = sotLive.filter((c) => c.trend_class === "new_creator").length;
          const monthDay   = sotLive[0]?.month_day ?? null;
          const monthRem   = sotLive[0]?.month_days_remaining ?? null;
          const nearActivityUp = sotLive
            .filter((c) => c.days_to_next_activity_level !== null
                          && c.days_to_next_activity_level <= 3
                          && (c.ist_activity_level ?? 0) < 5)
            .sort((a, b) => (a.days_to_next_activity_level ?? 99) - (b.days_to_next_activity_level ?? 99));
          const nearTierUp = sotLive
            .filter((c) => c.max_diamonds_to_next_tier !== null
                          && c.max_diamonds_to_next_tier <= 100_000
                          && c.max_diamonds_to_next_tier > 0)
            .sort((a, b) => (a.max_diamonds_to_next_tier ?? 9e9) - (b.max_diamonds_to_next_tier ?? 9e9));
          const wachsendCreators = sotLive.filter((c) => c.trend_class === "wachsend");

          if (sotLive.length === 0) {
            return (
              <div className="border border-champagne/15 p-7 text-center">
                <p className="text-cream/55 mb-3">Keine sot_live-Daten fuer {monthLabel}.</p>
                <p className="text-cream/40 text-xs">
                  Wartet auf Workstation-Scraper-Run (3-Tab-Flow). Solange nur Legacy-Werte vorhanden.
                </p>
              </div>
            );
          }

          // Phase B2.1 · Incremental ist Network-Hebel (R17, Master-Prompt §2.3)
          const sumDiamonds = sotLive.reduce((s, c) => s + (Number(c.live_current_diamonds) || 0), 0);
          // Pace-Hochrechnung für Network-Diamonds
          const realDiamonds = (monthDay && monthDay > 0)
            ? Math.round(sumDiamonds * (((sotLive[0]?.month_days_total ?? 31)) / monthDay))
            : null;
          // Top-Beiträger zum Network-Diamond-Pool
          const topDiamondContributors = [...sotLive]
            .filter((c) => c.live_current_diamonds !== null)
            .sort((a, b) => (Number(b.live_current_diamonds) || 0) - (Number(a.live_current_diamonds) || 0))
            .slice(0, 6);
          const incActive = sotLive.filter((c) => c.ist_incremental_usd !== null && Number(c.ist_incremental_usd) > 0).length;
          return (
            <>
              {/* ============ STAT-CARDS · deutsche Hauptlabels ============ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                <OverviewCard
                  label="Aktueller Netzwerkstand"
                  hint="bestätigt heute"
                  value={fmtUsd(sumIst)}
                  sub={`${sotLive.length} Creator aktuell · Tag ${monthDay ?? "?"} von ${(sotLive[0]?.month_day ?? 0) + (sotLive[0]?.month_days_remaining ?? 0)}`}
                  highlight
                />
                <OverviewCard
                  label="Hochrechnung Monatsende"
                  hint="bei gleichbleibender Pace"
                  value={fmtUsd(sumReal)}
                  sub={monthRem !== null ? `noch ${monthRem} Tage · keine TikTok-Prognose` : "—"}
                  highlight
                />
                <OverviewCard
                  label="Über persönlichem Schnitt"
                  hint="vs. 3-Monats-Durchschnitt"
                  value={`${cntWachsend} / ${cntStabil}`}
                  sub={`über / im Schnitt · ${cntNew} neue Creator`}
                />
                <OverviewCard
                  label="Unter persönlichem Schnitt"
                  hint="vs. 3-Monats-Durchschnitt"
                  value={`${cntFallend}`}
                  sub="häufig: Inkrementeller Bonus aktuell pausiert"
                />
              </div>

              {/* ============ INKREMENTELLER UMSATZANREIZ · Network-Hebel ============ */}
              <div className="border border-champagne/30 bg-champagne/[0.03] p-5 mb-8">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <p className="text-cream text-base font-medium">Inkrementeller Umsatzanreiz</p>
                    <p className="text-cream/50 text-[10px] uppercase tracking-[0.2em] mt-0.5">
                      Network-Hebel · nicht pro Creator · Incremental
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display italic text-2xl text-champagne leading-none">
                      {incActive > 0 ? "aktiv" : "pausiert"}
                    </p>
                    <p className="text-cream/45 text-[10px] mt-1">
                      {incActive > 0 ? `${incActive}/${sotLive.length} Creator mit Bonus` : "Schwelle nicht erreicht"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-5">
                  <div className="border border-champagne/15 p-3">
                    <p className="text-cream/55 text-[10px] uppercase tracking-[0.2em] mb-1.5">Network-Diamanten aktuell</p>
                    <p className="font-display italic text-xl text-cream">{fmtBigInt(sumDiamonds)}</p>
                    <p className="text-cream/40 text-[10px] mt-1">Summe aller Creator · Tag {monthDay}</p>
                  </div>
                  <div className="border border-champagne/15 p-3">
                    <p className="text-cream/55 text-[10px] uppercase tracking-[0.2em] mb-1.5">Hochrechnung Monatsende</p>
                    <p className="font-display italic text-xl text-cream">{realDiamonds !== null ? fmtBigInt(realDiamonds) : "—"}</p>
                    <p className="text-cream/40 text-[10px] mt-1">bei gleichbleibender Pace</p>
                  </div>
                  <div className="border border-champagne/15 p-3 col-span-2 md:col-span-1">
                    <p className="text-cream/55 text-[10px] uppercase tracking-[0.2em] mb-1.5">Diamanten-Bezugswert</p>
                    <p className="font-display italic text-xl text-cream/50">noch nicht erfasst</p>
                    <p className="text-cream/40 text-[10px] mt-1">muss aus Backstage-Workspace separat synchronisiert werden</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-cream/85 text-xs font-medium mb-2">Größte Beiträger zum Network-Pool</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {topDiamondContributors.map((c) => (
                      <div key={c.tiktok_username} className="flex items-baseline justify-between text-xs border-l border-champagne/20 pl-2">
                        <a href={`/portal/admin/umsatz/creator/${encodeURIComponent(c.tiktok_username.toLowerCase())}`}
                           className="text-cream hover:text-champagne truncate mr-2">
                          @{c.tiktok_username}
                        </a>
                        <span className="text-champagne/85 whitespace-nowrap">
                          {fmtBigInt(c.live_current_diamonds)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-cream/55 text-[11px] leading-relaxed border-t border-champagne/10 pt-3">
                  Der inkrementelle Umsatzanreiz ist ein <strong className="text-cream/75">Network-Ziel</strong>,
                  kein Creator-Bonus. Erst wenn das gesamte Netzwerk eine
                  Zielerfüllungsrate von ≥ 70 % gegen den TikTok-Diamanten-Bezugswert
                  erreicht, zahlt der inkrementelle Bonus aus
                  ({incActive > 0 ? "aktuell aktiv" : "aktuell pausiert, weil Schwelle nicht erreicht"}).
                  Stufen 1–13 mit 2 %–15 % Bonus je nach Erfüllungsgrad.
                  Der Bezugswert ist noch nicht in der Datenbank — kommt in eigener Sync-Phase.
                </p>
              </div>

              {/* ============ QUICK-WINS · deutsche Labels + V1.3 Signal ============ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-8">
                {/* Activity-Level-Up nahe */}
                <div className={`border p-4 ${nearActivityUp.length > 0 ? "border-champagne/45 bg-champagne/[0.05]" : "border-champagne/15"}`}>
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <p className="text-cream/85 text-xs font-medium">Kurz vor Aktivitätsaufstieg</p>
                      <p className="text-cream/40 text-[10px] uppercase tracking-[0.18em]">Activity-Level</p>
                    </div>
                    <span className="text-champagne font-display italic text-xl leading-none">{nearActivityUp.length}</span>
                  </div>
                  {nearActivityUp.length === 0 ? (
                    <p className="text-cream/40 text-xs">—</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {nearActivityUp.slice(0, 6).map((c) => (
                        <li key={c.tiktok_username} className="flex items-baseline justify-between text-xs">
                          <a href={`/portal/admin/umsatz/creator/${encodeURIComponent(c.tiktok_username.toLowerCase())}`}
                             className="text-cream hover:text-champagne truncate flex-1 mr-2">
                            @{c.tiktok_username}
                          </a>
                          <span className="text-champagne/85 whitespace-nowrap">
                            {c.days_to_next_activity_level === 0 ? "jetzt" : `${c.days_to_next_activity_level}d`}
                          </span>
                          <span className="text-cream/40 text-[10px] ml-2">L{c.ist_activity_level}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Tier-Up nahe (≤100k Diamonds) */}
                <div className={`border p-4 ${nearTierUp.length > 0 ? "border-champagne/45 bg-champagne/[0.05]" : "border-champagne/15"}`}>
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <p className="text-cream/85 text-xs font-medium">Kurz vor nächster Stufe</p>
                      <p className="text-cream/40 text-[10px] uppercase tracking-[0.18em]">Tier · ≤100k Diamonds</p>
                    </div>
                    <span className="text-champagne font-display italic text-xl leading-none">{nearTierUp.length}</span>
                  </div>
                  {nearTierUp.length === 0 ? (
                    <p className="text-cream/40 text-xs">—</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {nearTierUp.slice(0, 6).map((c) => (
                        <li key={c.tiktok_username} className="flex items-baseline justify-between text-xs">
                          <a href={`/portal/admin/umsatz/creator/${encodeURIComponent(c.tiktok_username.toLowerCase())}`}
                             className="text-cream hover:text-champagne truncate flex-1 mr-2">
                            @{c.tiktok_username}
                          </a>
                          <span className="text-champagne/85 whitespace-nowrap">
                            {fmtBigInt(c.max_diamonds_to_next_tier)}
                          </span>
                          <span className="text-cream/40 text-[10px] ml-2">St{c.ist_tier_level}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Über persönlichem Schnitt */}
                <div className={`border p-4 ${wachsendCreators.length > 0 ? "border-champagne/45 bg-champagne/[0.05]" : "border-champagne/15"}`}>
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <p className="text-cream/85 text-xs font-medium">Über persönlichem Schnitt</p>
                      <p className="text-cream/40 text-[10px] uppercase tracking-[0.18em]">vs. 3-Monats-Avg</p>
                    </div>
                    <span className="text-champagne font-display italic text-xl leading-none">{wachsendCreators.length}</span>
                  </div>
                  {wachsendCreators.length === 0 ? (
                    <p className="text-cream/40 text-xs">— Mai networkweit unter 3M-Schnitt</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {wachsendCreators.slice(0, 6).map((c) => (
                        <li key={c.tiktok_username} className="flex items-baseline justify-between text-xs">
                          <a href={`/portal/admin/umsatz/creator/${encodeURIComponent(c.tiktok_username.toLowerCase())}`}
                             className="text-cream hover:text-champagne truncate flex-1 mr-2">
                            @{c.tiktok_username}
                          </a>
                          <span className="text-champagne/85 whitespace-nowrap">
                            {fmtUsd(c.real_projected_bonus_usd_eom)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* ============ Kontext-Hinweis (ruhig, kein Alarm) ============ */}
              {cntFallend > sotLive.length * 0.5 && (
                <div className="border border-champagne/20 bg-champagne/[0.04] p-4 mb-8 text-xs text-cream/75 leading-relaxed">
                  <p className="text-champagne/85 uppercase tracking-[0.2em] text-[10px] mb-1.5">Hinweis · Kontext</p>
                  {cntFallend} Creator liegen aktuell unter ihrem 3-Monats-Schnitt.
                  Hauptgrund netzwerkweit: Der inkrementelle Bonus zahlt diesen Monat nicht aus
                  (TikTok-Schwelle für das Network-Wachstum aktuell nicht erreicht).
                  Das ist KEIN Performance-Problem einzelner Creator — strukturell aus dem
                  Bonus-System. Bei aktueller Pace landet das Netzwerk bei {fmtUsd(sumReal)} bis Monatsende.
                </div>
              )}

              {/* ============ Volle Creator-Liste (alle 53 nach Priorität sortiert) ============ */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <p className="text-cream/85 text-sm font-medium">Alle Creator · sortiert nach Priorität</p>
                    <p className="text-cream/40 text-[10px] mt-0.5">
                      Hebel zuerst · Activity-Aufstieg ≤1d → Tier ≤50k → über Schnitt → Rest
                    </p>
                  </div>
                  <p className="text-cream/40 text-[10px]">{sotLive.length} Einträge</p>
                </div>
                <div className="overflow-x-auto border border-champagne/15">
                  <table className="w-full text-sm">
                    <thead className="bg-champagne/5">
                      <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-cream/55">
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Creator</th>
                        <th className="px-3 py-3 text-right">Aktuell</th>
                        <th className="px-3 py-3 text-right">Hochrechnung EOM</th>
                        <th className="px-3 py-3 text-center">vs. Schnitt</th>
                        <th className="px-3 py-3 text-center">Stufe</th>
                        <th className="px-3 py-3 text-center">Aktiv.</th>
                        <th className="px-3 py-3 text-right">bis Stufe</th>
                        <th className="px-3 py-3 text-right">bis Aktiv.</th>
                        <th className="px-3 py-3">Hinweis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sotLive.map((c, i) => {
                        const trendDe = c.trend_class === "wachsend" ? "über Schnitt"
                                      : c.trend_class === "fallend"  ? "unter Schnitt"
                                      : c.trend_class === "stabil"   ? "im Schnitt"
                                      : c.trend_class === "new_creator" ? "neuer Creator"
                                      : "—";
                        const trendCls = c.trend_class === "wachsend" ? "text-champagne"
                                       : c.trend_class === "fallend"  ? "text-cream/50"
                                       : c.trend_class === "stabil"   ? "text-cream/75"
                                       : "text-cream/40";
                        // V1.3+V1.6 · Premium-Signal-System (Champagne-Spektrum, kein rot/grün)
                        const prio = computePriority(c);
                        const elig = getEligibility(c);
                        const rowCls = prio === 0
                          ? "border-t border-champagne/40 bg-champagne/[0.08] hover:bg-champagne/[0.12]"
                          : prio === 1
                          ? "border-t border-champagne/30 bg-champagne/[0.06] hover:bg-champagne/[0.10]"
                          : prio === 2
                          ? "border-t border-champagne/20 bg-champagne/[0.03] hover:bg-champagne/[0.07]"
                          : prio === 3
                          ? "border-t border-champagne/15 hover:bg-champagne/[0.05]"
                          : c.trend_class === "fallend"
                          ? "border-t border-champagne/8 opacity-75 hover:bg-champagne/[0.03] hover:opacity-100"
                          : "border-t border-champagne/10 hover:bg-champagne/[0.03]";
                        // Quick-Win-Hinweis · Priorität-Vorgriff (Phase B3 wird das ablösen)
                        // V1.6: Eligibility-Hinweis hat höchste Priorität wenn nicht eligible UND $0
                        const hints: string[] = [];
                        const dn = c.days_to_next_activity_level;
                        const dm = c.max_diamonds_to_next_tier;
                        const istZero = (Number(c.ist_estimated_bonus_usd) || 0) === 0;
                        const hasDiamonds = (Number(c.live_current_diamonds) || 0) > 100_000;

                        if (!elig.eligible && elig.dataKnown && istZero && hasDiamonds) {
                          const parts: string[] = [];
                          if (elig.daysMissing > 0) parts.push(`${elig.daysMissing} LIVE-Tag${elig.daysMissing === 1 ? "" : "e"}`);
                          if (elig.hoursMissing > 0) parts.push(`${elig.hoursMissing} LIVE-Stunde${elig.hoursMissing === 1 ? "" : "n"}`);
                          hints.push(parts.length > 0
                            ? `Eligibility: noch ${parts.join(" + ")}`
                            : "Eligibility fehlt");
                        } else if (dn === 0 && (c.ist_activity_level ?? 0) < 5) {
                          hints.push("Aktivitätsaufstieg jetzt möglich");
                        } else if (dn !== null && dn > 0 && dn <= 3 && (c.ist_activity_level ?? 0) < 5) {
                          hints.push(`noch ${dn} LIVE-Tag${dn === 1 ? "" : "e"}`);
                        }
                        if (dm !== null && dm > 0 && dm <= 100_000) {
                          hints.push(`${fmtBigInt(dm)} Diamanten bis nächste Stufe`);
                        }
                        if (hints.length === 0) {
                          if (c.trend_class === "wachsend") hints.push("Über persönlichem Schnitt");
                          else if (c.meta_is_new_creator) hints.push("Neuer Creator");
                          else if (dn !== null && (c.ist_activity_level ?? 0) < 5) hints.push(`${dn}d bis nächstes Aktivitätslevel`);
                          else if (dm !== null && dm > 0) hints.push(`${fmtBigInt(dm)} bis nächste Stufe`);
                        }
                        const hint = hints.length === 0 ? "—" : hints.join(" · ");

                        const handleLower = c.tiktok_username.toLowerCase();
                        const isExpanded = expandHandle === handleLower;
                        // Toggle-URL: wenn aktuell expanded → expand wegnehmen, sonst auf diesen Handle setzen
                        const toggleHref = isExpanded
                          ? `?tab=overview`
                          : `?tab=overview&expand=${encodeURIComponent(handleLower)}`;
                        return (
                          <>
                          <tr
                            key={c.tiktok_username}
                            id={`creator-${handleLower}`}
                            className={`${rowCls} cursor-pointer scroll-mt-32`}
                          >
                            <td className="px-3 py-3 text-cream/40 font-display italic text-base">
                              <a href={toggleHref} className="block w-full">
                                <span className={isExpanded ? "text-champagne" : ""}>{i + 1}</span>
                              </a>
                            </td>
                            <td className="px-3 py-3">
                              <a href={toggleHref}
                                 className="text-cream hover:text-champagne flex items-center gap-2">
                                <span className="text-cream/40 text-xs leading-none">{isExpanded ? "▼" : "▸"}</span>
                                <span>@{c.tiktok_username}</span>
                              </a>
                            </td>
                            <td className="px-3 py-3 text-right">
                              {istZero && hasDiamonds && !elig.eligible && elig.dataKnown ? (
                                <div className="flex flex-col items-end leading-tight">
                                  <span className="text-cream/85 font-medium">{fmtUsd(c.ist_estimated_bonus_usd)}</span>
                                  <span className="text-[9px] uppercase tracking-[0.18em] text-champagne/70 mt-0.5">
                                    Eligibility fehlt
                                  </span>
                                </div>
                              ) : (
                                <span className="text-champagne font-medium">{fmtUsd(c.ist_estimated_bonus_usd)}</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right text-cream/85">{fmtUsd(c.real_projected_bonus_usd_eom)}</td>
                            <td className={`px-3 py-3 text-center text-[11px] ${trendCls}`}>{trendDe}</td>
                            <td className="px-3 py-3 text-center text-cream/75">{c.ist_tier_level ?? "—"}</td>
                            <td className="px-3 py-3 text-center text-cream/75">
                              {c.ist_activity_level ?? "—"}
                              {c.ist_activity_ratio !== null && (
                                <span className="text-cream/40 text-[10px] ml-1">
                                  {`${(Number(c.ist_activity_ratio) * 100).toFixed(1).replace(".", ",")} %`}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right text-cream/70">
                              {c.max_diamonds_to_next_tier !== null ? fmtBigInt(c.max_diamonds_to_next_tier) : "—"}
                            </td>
                            <td className="px-3 py-3 text-right text-cream/70">
                              {c.days_to_next_activity_level === null ? "—"
                                : c.days_to_next_activity_level === 0 ? <span className="text-champagne">jetzt</span>
                                : `${c.days_to_next_activity_level}d`}
                            </td>
                            <td className="px-3 py-3 text-cream/75 text-xs">{hint}</td>
                          </tr>
                          {isExpanded && expandedDetail && (
                            <tr key={c.tiktok_username + "-detail"} className="border-t border-champagne/30 bg-ink/40">
                              <td className="px-3 py-4" colSpan={10}>
                                {/* V1.6 · Eligibility-Block (nur wenn nicht teilnahmeberechtigt UND $0) */}
                                {!elig.eligible && elig.dataKnown && istZero && hasDiamonds && (
                                  <div className="mb-4 pb-3 border-b border-champagne/15 bg-champagne/[0.04] -mx-3 -mt-4 px-3 pt-3">
                                    <div className="flex items-baseline justify-between mb-2">
                                      <p className="text-champagne text-xs font-medium uppercase tracking-[0.18em]">
                                        ▴ Noch nicht teilnahmeberechtigt
                                      </p>
                                      {expandedDetail.ist_forecast_revenue_usd !== null && Number(expandedDetail.ist_forecast_revenue_usd) > 0 && (
                                        <p className="text-cream/55 text-[10px]">
                                          Forecast bei Eligibility: <span className="text-champagne/85">{fmtUsd(expandedDetail.ist_forecast_revenue_usd)}</span>
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-cream/80 text-sm leading-relaxed">
                                      Aktuell $0 Tier-Bonus, weil TikTok die Mindestaktivität noch nicht erfüllt sieht.
                                      Es fehlen noch
                                      {elig.daysMissing > 0 && (
                                        <span className="text-champagne/85"> {elig.daysMissing} gültige LIVE-Tag{elig.daysMissing === 1 ? "" : "e"}</span>
                                      )}
                                      {elig.daysMissing > 0 && elig.hoursMissing > 0 && " und "}
                                      {elig.hoursMissing > 0 && (
                                        <span className="text-champagne/85">{elig.hoursMissing} LIVE-Stunde{elig.hoursMissing === 1 ? "" : "n"}</span>
                                      )}
                                      {" "}(Mindestanforderung: 7 LIVE-Tage + 15h LIVE-Dauer).
                                      Sobald das erreicht ist, springt der Tier-Bonus auf den TikTok-Forecast.
                                    </p>
                                  </div>
                                )}

                                {/* Begründungs-Block (oberhalb) */}
                                <div className="mb-4 pb-3 border-b border-champagne/15">
                                  <p className="text-cream/55 text-[10px] uppercase tracking-[0.22em] mb-1.5">Warum diese Position</p>
                                  <p className="text-cream/85 text-sm">
                                    {prio === 0 ? "Eligibility fast erreicht — Bonus springt sobald LIVE-Mindestaktivität erfüllt ist."
                                     : prio === 1 ? "Aktivitäts-Aufstieg in Reichweite (≤1 LIVE-Tag bis nächstes Level)."
                                     : prio === 2 ? "Tier-Aufstieg in Reichweite (≤50 000 Diamanten bis nächste Stufe)."
                                     : prio === 3 ? "Über persönlichem 3-Monats-Schnitt."
                                     : c.trend_class === "fallend" ? "Aktuell unter persönlichem 3-Monats-Schnitt — meist strukturell durch fehlenden inkrementellen Bonus."
                                     : c.meta_is_new_creator ? "Neuer Creator · Trend-Vergleich noch nicht aussagekräftig."
                                     : "Stabil im Mittelfeld."}
                                  </p>
                                </div>

                                {/* 4-Spalten-Detail-Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  {/* LIVE-Performance */}
                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-2">LIVE-Tage</p>
                                    <p className="text-cream font-medium text-sm">
                                      {c.live_valid_days ?? "—"}
                                      {expandedDetail.live_days_compare !== null && (
                                        <span className="text-cream/45 text-xs ml-1">
                                          vs. {expandedDetail.live_days_compare}
                                        </span>
                                      )}
                                    </p>
                                    {expandedDetail.live_days_compare_pct !== null && (
                                      <p className={`text-[10px] mt-0.5 ${Number(expandedDetail.live_days_compare_pct) >= 0 ? "text-champagne/70" : "text-cream/45"}`}>
                                        {Number(expandedDetail.live_days_compare_pct) >= 0 ? "+" : ""}
                                        {Number(expandedDetail.live_days_compare_pct).toFixed(1).replace(".", ",")} %
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-2">LIVE-Dauer</p>
                                    <p className="text-cream font-medium text-sm">
                                      {c.live_duration_seconds !== null
                                        ? `${Math.floor(c.live_duration_seconds / 3600)}h ${Math.floor((c.live_duration_seconds % 3600) / 60)}m`
                                        : "—"}
                                    </p>
                                    {expandedDetail.live_duration_compare_pct !== null && (
                                      <p className={`text-[10px] mt-0.5 ${Number(expandedDetail.live_duration_compare_pct) >= 0 ? "text-champagne/70" : "text-cream/45"}`}>
                                        {Number(expandedDetail.live_duration_compare_pct) >= 0 ? "+" : ""}
                                        {Number(expandedDetail.live_duration_compare_pct).toFixed(1).replace(".", ",")} %
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-2">Streams</p>
                                    <p className="text-cream font-medium text-sm">
                                      {c.live_streams_count ?? "—"}
                                      {expandedDetail.live_streams_compare !== null && (
                                        <span className="text-cream/45 text-xs ml-1">
                                          vs. {expandedDetail.live_streams_compare}
                                        </span>
                                      )}
                                    </p>
                                    {expandedDetail.live_streams_compare_pct !== null && (
                                      <p className={`text-[10px] mt-0.5 ${Number(expandedDetail.live_streams_compare_pct) >= 0 ? "text-champagne/70" : "text-cream/45"}`}>
                                        {Number(expandedDetail.live_streams_compare_pct) >= 0 ? "+" : ""}
                                        {Number(expandedDetail.live_streams_compare_pct).toFixed(1).replace(".", ",")} %
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-2">Neue Follower</p>
                                    <p className="text-cream font-medium text-sm">
                                      {c.live_new_followers ?? "—"}
                                      {expandedDetail.live_followers_compare !== null && (
                                        <span className="text-cream/45 text-xs ml-1">
                                          vs. {expandedDetail.live_followers_compare}
                                        </span>
                                      )}
                                    </p>
                                    {expandedDetail.live_followers_compare_pct !== null && (
                                      <p className={`text-[10px] mt-0.5 ${Number(expandedDetail.live_followers_compare_pct) >= 0 ? "text-champagne/70" : "text-cream/45"}`}>
                                        {Number(expandedDetail.live_followers_compare_pct) >= 0 ? "+" : ""}
                                        {Number(expandedDetail.live_followers_compare_pct).toFixed(1).replace(".", ",")} %
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Tier-Fortschritt Mini-Bar */}
                                {expandedDetail.ist_tier_target !== null && c.live_current_diamonds !== null && (
                                  <div className="mb-4">
                                    <div className="flex items-baseline justify-between mb-1.5">
                                      <p className="text-cream/55 text-[10px] uppercase tracking-[0.2em]">
                                        Tier-Fortschritt · Stufe {c.ist_tier_level ?? "?"}
                                      </p>
                                      <p className="text-cream/85 text-xs">
                                        {fmtBigInt(expandedDetail.ist_tier_progress)} / {fmtBigInt(expandedDetail.ist_tier_target)}
                                      </p>
                                    </div>
                                    <div className="h-1 bg-champagne/10 rounded-none overflow-hidden">
                                      <div
                                        className="h-full bg-champagne/60"
                                        style={{
                                          width: `${Math.min(100, Math.max(0, ((Number(expandedDetail.ist_tier_progress) || 0) / Math.max(1, Number(expandedDetail.ist_tier_target) || 1)) * 100))}%`
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Bottom-Reihe · Activity / Forecast / Meta / Drift */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-1">Aktivität · Bonusverhältnis</p>
                                    <p className="text-cream/85">
                                      Level {c.ist_activity_level ?? "?"}
                                      {c.ist_activity_ratio !== null && ` · ${(Number(c.ist_activity_ratio) * 100).toFixed(1).replace(".", ",")} %`}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-1">TikTok-Forecast</p>
                                    <p className="text-cream/85">
                                      {fmtUsd(expandedDetail.ist_forecast_revenue_usd)} · {fmtBigInt(expandedDetail.ist_forecast_diamonds)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-1">Letztes LIVE</p>
                                    <p className="text-cream/85">
                                      {expandedDetail.meta_last_live_at
                                        ? new Date(expandedDetail.meta_last_live_at).toLocaleString("de-DE", {
                                            day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                                          })
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-cream/45 text-[9px] uppercase tracking-[0.2em] mb-1">Vergleichszeitraum</p>
                                    <p className="text-cream/85">
                                      {expandedDetail.live_compare_start && expandedDetail.live_compare_end
                                        ? `${new Date(expandedDetail.live_compare_start).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })} – ${new Date(expandedDetail.live_compare_end).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}`
                                        : "—"}
                                    </p>
                                  </div>
                                </div>

                                {/* Drift-Indikator nur wenn relevant */}
                                {c.drift_pct !== null && Number(c.drift_pct) > 1 && (
                                  <p className="text-cream/40 text-[10px] mt-3 pt-3 border-t border-champagne/10">
                                    Sanity-Check Drift TikTok ↔ ZOE-Summe: {Number(c.drift_pct).toFixed(2).replace(".", ",")} %
                                  </p>
                                )}

                                {/* Footer-Aktion: Volle Detail-Page */}
                                <div className="mt-4 pt-3 border-t border-champagne/15 flex justify-between items-baseline">
                                  <a href={toggleHref} className="text-cream/55 hover:text-cream text-[10px] uppercase tracking-[0.2em]">
                                    ← schließen
                                  </a>
                                  <a
                                    href={`/portal/admin/umsatz/creator/${encodeURIComponent(handleLower)}`}
                                    className="text-champagne/85 hover:text-champagne text-[10px] uppercase tracking-[0.2em]"
                                  >
                                    Monats-Historie öffnen →
                                  </a>
                                </div>
                              </td>
                            </tr>
                          )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}

        {/* ============= CREATOR-TAB (aggregiert) ============= */}
        {tab === "creator" && (
          creatorAgg.length === 0 ? (
            <div className="border border-champagne/15 p-7 text-center">
              <p className="text-cream/55">
                Noch keine Revenue-Daten vorhanden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-champagne/15">
              <table className="w-full text-sm">
                <thead className="bg-champagne/5">
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-cream/55">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Creator</th>
                    <th className="px-3 py-3 text-right">Gesamt Umsatz</th>
                    <th className="px-3 py-3 text-right">Total Revenue</th>
                    <th className="px-3 py-3 text-right">Activity</th>
                    <th className="px-3 py-3 text-right">Tier</th>
                    <th className="px-3 py-3 text-right">Incremental</th>
                    <th className="px-3 py-3 text-right">Forecast aktuell</th>
                    <th className="px-3 py-3 text-right">Monate</th>
                    <th className="px-3 py-3 text-right">Letzter Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {creatorAgg.map((c, i) => (
                    <tr key={c.tiktok_username} className="border-t border-champagne/10 hover:bg-champagne/[0.05]">
                      <td className="px-3 py-3 text-cream/40 font-display italic text-base">{i + 1}</td>
                      <td className="px-3 py-3">
                        <a href={`/portal/admin/umsatz/creator/${encodeURIComponent(c.tiktok_username.toLowerCase())}`}
                           className="block group">
                          <div className="text-cream font-medium group-hover:text-champagne transition-colors">
                            {c.display_name || c.tiktok_username}
                          </div>
                          <div className="text-cream/45 text-xs">@{c.tiktok_username}</div>
                        </a>
                      </td>
                      <td className="px-3 py-3 text-right text-champagne font-medium">{fmtUsd(c.total_sum_usd)}</td>
                      <td className="px-3 py-3 text-right text-champagne/85">{fmtUsd(c.current_total_usd)}</td>
                      <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(c.current_activity_usd)}</td>
                      <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(c.current_tier_usd)}</td>
                      <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(c.current_incremental_usd)}</td>
                      <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(c.forecast_current_usd)}</td>
                      <td className="px-3 py-3 text-right text-cream/80">{c.months_count}</td>
                      <td className="px-3 py-3 text-right text-cream/60 text-xs">
                        {c.last_sync
                          ? new Date(c.last_sync).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ============= TABELLE fuer Current/Forecast/Missing ============= */}
        {(tab === "current" || tab === "forecast" || tab === "missing") && (rows.length === 0 ? (
          <div className="border border-champagne/15 p-7 text-center">
            <p className="text-cream/55 mb-3">
              Noch keine Backstage-Anreize-Daten fuer {monthLabel}.
            </p>
            <p className="text-cream/40 text-xs leading-relaxed max-w-xl mx-auto">
              Phase 1 fertig: DB-Schema + API + Page existieren.<br/>
              Phase 2 offen: Workstation-Scraper muss Backstage-Anreize-Pages
              (Activity / Tier / Incremental) auslesen + an /api/sync/backstage-revenue
              pushen. Kommt im naechsten Schritt sobald die Page-Selektoren
              live gemappt sind.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-champagne/15">
            <table className="w-full text-sm">
              <thead className="bg-champagne/5">
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-cream/55">
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Creator</th>
                  {tab === "current" && (
                    <>
                      <th className="px-3 py-3 text-right">Total</th>
                      <th className="px-3 py-3 text-right">Activity</th>
                      <th className="px-3 py-3 text-right">Tier</th>
                      <th className="px-3 py-3 text-right">Incremental</th>
                      <th className="px-3 py-3 text-right">Last Period</th>
                    </>
                  )}
                  {tab === "forecast" && (
                    <>
                      <th className="px-3 py-3 text-right">Forecast Revenue</th>
                      <th className="px-3 py-3 text-right">Forecast Diamonds</th>
                      <th className="px-3 py-3 text-right">Forecast Bonus</th>
                    </>
                  )}
                  {tab === "missing" && (
                    <>
                      <th className="px-3 py-3 text-right">Missing Revenue</th>
                      <th className="px-3 py-3 text-right">Missing Diamonds</th>
                      <th className="px-3 py-3 text-center">Next Target</th>
                      <th className="px-3 py-3 text-center">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.tiktok_username} className="border-t border-champagne/10 hover:bg-champagne/[0.03]">
                    <td className="px-3 py-3 text-cream/40 font-display italic text-base">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="text-cream font-medium">{r.display_name || r.tiktok_username}</div>
                      <div className="text-cream/45 text-xs">@{r.tiktok_username}</div>
                    </td>
                    {tab === "current" && (
                      <>
                        <td className="px-3 py-3 text-right text-champagne font-medium">{fmtUsd(r.total_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(r.activity_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(r.tier_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(r.incremental_revenue_usd)}</td>
                        <td className={`px-3 py-3 text-right ${fmtPctClass(r.total_revenue_usd, r.last_period_total_usd)}`}>
                          {fmtPct(r.total_revenue_usd, r.last_period_total_usd)}
                        </td>
                      </>
                    )}
                    {tab === "forecast" && (
                      <>
                        <td className="px-3 py-3 text-right text-champagne font-medium">{fmtUsd(r.forecast_revenue_usd)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{fmtBigInt(r.forecast_diamonds)}</td>
                        <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(r.forecast_bonus_usd)}</td>
                      </>
                    )}
                    {tab === "missing" && (() => {
                      const sb = statusBadge(r.missing_status);
                      return (
                        <>
                          <td className="px-3 py-3 text-right text-cream/80">{fmtUsd(r.missing_revenue_usd)}</td>
                          <td className="px-3 py-3 text-right text-cream/80">{fmtBigInt(r.missing_diamonds)}</td>
                          <td className="px-3 py-3 text-center text-cream/85">{r.missing_next_tier_label || "—"}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${sb.cls}`}>
                              {sb.label}
                            </span>
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
                {tab === "current" && rows.length > 0 && (
                  <tr className="border-t border-champagne/30 bg-champagne/5 font-medium">
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-cream/85 uppercase text-[10px] tracking-[0.2em]">Total</td>
                    <td className="px-3 py-3 text-right text-champagne">{fmtUsd(sumTotal)}</td>
                    <td className="px-3 py-3 text-right text-cream">{fmtUsd(sumActivity)}</td>
                    <td className="px-3 py-3 text-right text-cream">{fmtUsd(sumTier)}</td>
                    <td className="px-3 py-3 text-right text-cream">{fmtUsd(sumIncr)}</td>
                    <td className="px-3 py-3"></td>
                  </tr>
                )}
                {tab === "forecast" && rows.length > 0 && (
                  <tr className="border-t border-champagne/30 bg-champagne/5 font-medium">
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-cream/85 uppercase text-[10px] tracking-[0.2em]">Total Forecast</td>
                    <td className="px-3 py-3 text-right text-champagne">{fmtUsd(sumForecast)}</td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))}

        <p className="text-cream/35 text-xs mt-6 leading-relaxed max-w-3xl">
          Quelle: TikTok Backstage Anreize-Pages + LIVE-Leistung + Creator-Karte.
          Daten fliessen ueber /api/sync/backstage-revenue + live-performance +
          creator-meta. Migrationen 0048/0049 (revenue) + 0057-0059 (C-Block) +
          0060 (View v_creator_incentive_summary) + 0061 (Compute v2).
        </p>
      </main>
    </>
  );
}

// Phase B2 · Overview-Stat-Card (kompakt, deutsch primär, technisch sekundär)
function OverviewCard({ label, hint, value, sub, highlight }: {
  label: string;
  hint?: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border p-4 ${highlight ? "border-champagne/40 bg-champagne/5" : "border-champagne/15"}`}>
      <p className="text-cream/85 text-xs font-medium leading-tight">{label}</p>
      {hint && (
        <p className="text-cream/40 text-[10px] uppercase tracking-[0.18em] mt-0.5 mb-2">{hint}</p>
      )}
      <p className={`font-display italic text-2xl md:text-3xl leading-tight mt-2 ${highlight ? "text-champagne" : "text-cream"}`}>
        {value}
      </p>
      {sub && (
        <p className="text-cream/40 text-[10px] mt-2 leading-relaxed">{sub}</p>
      )}
    </div>
  );
}
