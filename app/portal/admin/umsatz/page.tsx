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

type SubTab = "current" | "forecast" | "missing" | "creator";

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
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminUmsatzPage({ searchParams }: PageProps) {
  const { profile } = await requireAdmin();
  const { loadLocale } = await import("@/lib/i18n");
  const { t } = await loadLocale();
  const sp = await searchParams;
  const tab: SubTab =
    sp.tab === "forecast" ? "forecast" :
    sp.tab === "missing"  ? "missing"  :
    sp.tab === "creator"  ? "creator"  : "current";

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

        {/* SUB-TABS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:flex md:flex-wrap md:gap-2 mb-6 md:mb-5 border-b border-champagne/15 pb-3">
          {(["current","forecast","missing","creator"] as const).map((t) => {
            const active = t === tab;
            const label = t === "current" ? "Current"
                        : t === "forecast" ? "Forecast"
                        : t === "missing" ? "Missing"
                        : "Creator";
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
        {tab !== "creator" && (rows.length === 0 ? (
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
          Quelle: TikTok Backstage Anreize-Pages (Desktop-Version, da Mobile
          den roten Banner ueber Werte legt). Daten fliessen ueber
          /api/sync/backstage-revenue in creator_revenue_metrics (Migration 0048).
          Aktualisierung: nach Setup der Workstation-Pipeline taeglich.
        </p>
      </main>
    </>
  );
}
