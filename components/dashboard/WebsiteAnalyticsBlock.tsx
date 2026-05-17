// Admin-only Website-Analytics-Block.
// Aggregiert public_page_view + join_open + creator_application_submit
// fuer Cards (Visitors, Conversion) + Top-Pages-Tabelle + Funnel.
//
// Renders nichts wenn role !== 'admin'.

import { createClient } from "@/lib/supabase/server";

function isoToday(): string {
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString();
}
function isoDaysAgo(n: number): string {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function isoStartOfMonth(): string {
  const d = new Date(); d.setHours(0,0,0,0);
  d.setDate(1);
  return d.toISOString();
}

interface TopPage {
  path: string;
  views_today: number;
  views_month: number;
  unique_visitors_month: number;
}

export async function WebsiteAnalyticsBlock({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;

  const supabase = await createClient();
  const today = isoToday();
  const day7 = isoDaysAgo(7);
  const day30 = isoDaysAgo(30);
  const monthStart = isoStartOfMonth();

  const [
    visitorsTodayRes,
    visitors7dRes,
    visitors30dRes,
    pageViewsTodayRes,
    applicationsTodayRes,
    joinOpenLast30Res,
    appSubmitLast30Res,
    pagesTodayRes,
    pagesMonthRes,
  ] = await Promise.all([
    supabase.from("admin_analytics_events").select("session_id")
      .eq("event_type", "public_page_view").gte("created_at", today),
    supabase.from("admin_analytics_events").select("session_id")
      .eq("event_type", "public_page_view").gte("created_at", day7),
    supabase.from("admin_analytics_events").select("session_id")
      .eq("event_type", "public_page_view").gte("created_at", day30),
    supabase.from("admin_analytics_events").select("id", { count: "exact", head: true })
      .eq("event_type", "public_page_view").gte("created_at", today),
    supabase.from("admin_analytics_events").select("id", { count: "exact", head: true })
      .eq("event_type", "creator_application_submit").gte("created_at", today),
    supabase.from("admin_analytics_events").select("id", { count: "exact", head: true })
      .eq("event_type", "join_open").gte("created_at", day30),
    supabase.from("admin_analytics_events").select("id", { count: "exact", head: true })
      .eq("event_type", "creator_application_submit").gte("created_at", day30),
    supabase.from("admin_analytics_events").select("path")
      .eq("event_type", "public_page_view").gte("created_at", today)
      .not("path", "is", null).limit(5000),
    supabase.from("admin_analytics_events").select("path, session_id")
      .eq("event_type", "public_page_view").gte("created_at", monthStart)
      .not("path", "is", null).limit(20000),
  ]);

  const distinct = (rows: { session_id: string | null }[] | null): number => {
    if (!rows) return 0;
    const s = new Set<string>();
    for (const r of rows) if (r.session_id) s.add(r.session_id);
    return s.size;
  };

  const visitorsToday = distinct(visitorsTodayRes.data);
  const visitors7d = distinct(visitors7dRes.data);
  const visitors30d = distinct(visitors30dRes.data);
  const pageViewsToday = pageViewsTodayRes.count ?? 0;
  const applicationsToday = applicationsTodayRes.count ?? 0;
  const joinOpenLast30 = joinOpenLast30Res.count ?? 0;
  const appSubmitLast30 = appSubmitLast30Res.count ?? 0;
  const conversion30d = joinOpenLast30 > 0
    ? (appSubmitLast30 / joinOpenLast30) * 100
    : 0;

  // Top-Pages-Aggregation client-side (Supabase JS hat keine GROUP BY)
  const todayMap = new Map<string, number>();
  for (const r of (pagesTodayRes.data ?? [])) {
    if (!r.path) continue;
    todayMap.set(r.path, (todayMap.get(r.path) ?? 0) + 1);
  }
  const monthMap = new Map<string, number>();
  const uniqueMap = new Map<string, Set<string>>();
  for (const r of (pagesMonthRes.data ?? [])) {
    if (!r.path) continue;
    monthMap.set(r.path, (monthMap.get(r.path) ?? 0) + 1);
    if (r.session_id) {
      if (!uniqueMap.has(r.path)) uniqueMap.set(r.path, new Set());
      uniqueMap.get(r.path)!.add(r.session_id);
    }
  }
  // Union der Pfade aus heute + Monat (Monat ist Obermenge der meisten Pfade)
  const allPaths = new Set<string>([...todayMap.keys(), ...monthMap.keys()]);
  const topPages: TopPage[] = Array.from(allPaths)
    .map(p => ({
      path: p,
      views_today: todayMap.get(p) ?? 0,
      views_month: monthMap.get(p) ?? 0,
      unique_visitors_month: uniqueMap.get(p)?.size ?? 0,
    }))
    .sort((a, b) => b.views_month - a.views_month)
    .slice(0, 15);

  // Max-Wert fuer Mini-Balken
  const maxMonth = topPages.length > 0 ? Math.max(...topPages.map(p => p.views_month)) : 1;

  return (
    <section className="mb-12">
      <p className="eyebrow mb-4">Website Analytics</p>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Besucher heute" value={visitorsToday} />
        <MetricCard label="Besucher 7 Tage" value={visitors7d} />
        <MetricCard label="Besucher 30 Tage" value={visitors30d} />
        <MetricCard label="Seitenaufrufe heute" value={pageViewsToday} />
        <MetricCard label="Anfragen heute" value={applicationsToday} highlight={applicationsToday > 0} />
        <MetricCard
          label="Conversion 30d"
          value={`${conversion30d.toFixed(1)}%`}
          sublabel={`${appSubmitLast30}/${joinOpenLast30}`}
        />
      </div>

      {/* Join-Funnel-Block */}
      <div className="border border-champagne/15 px-5 py-4 mb-6">
        <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em] mb-3">Join-Funnel (30 Tage)</p>
        <div className="grid grid-cols-3 gap-4 items-center">
          <FunnelStep label="/join geoeffnet" value={joinOpenLast30} />
          <div className="text-center text-champagne/40 text-2xl" aria-hidden>→</div>
          <FunnelStep label="Anfrage abgesendet" value={appSubmitLast30} />
        </div>
        <p className="text-cream/40 text-xs mt-3 text-center">
          Conversion-Rate: <span className="text-champagne tabular-nums">{conversion30d.toFixed(2)}%</span>
        </p>
      </div>

      {/* Top-Pages-Tabelle */}
      <div className="border border-champagne/15">
        <div className="flex items-baseline justify-between px-4 py-3 border-b border-champagne/10">
          <p className="text-cream/80 text-[11px] uppercase tracking-[0.25em]">Meistbesuchte Seiten (Monat)</p>
          <p className="text-cream/40 text-[10px]">{topPages.length} Pfade</p>
        </div>
        {topPages.length === 0 ? (
          <p className="px-4 py-6 text-cream/40 text-sm">Noch keine Public-Pageviews aufgezeichnet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-cream/40 text-[10px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="text-left px-4 py-3 font-normal">Seite</th>
                  <th className="text-right px-4 py-3 font-normal">Heute</th>
                  <th className="text-right px-4 py-3 font-normal">Monat</th>
                  <th className="text-right px-4 py-3 font-normal">Unique</th>
                  <th className="text-left px-4 py-3 font-normal w-[180px]">Trend (Monat)</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p) => {
                  const pct = maxMonth > 0 ? (p.views_month / maxMonth) * 100 : 0;
                  return (
                    <tr key={p.path} className="border-t border-champagne/5">
                      <td className="px-4 py-3 text-cream font-mono text-xs truncate max-w-[280px]" title={p.path}>
                        {p.path}
                      </td>
                      <td className="px-4 py-3 text-right text-cream/80 tabular-nums">{p.views_today}</td>
                      <td className="px-4 py-3 text-right text-cream tabular-nums">{p.views_month}</td>
                      <td className="px-4 py-3 text-right text-cream/70 tabular-nums">{p.unique_visitors_month}</td>
                      <td className="px-4 py-3">
                        <div className="h-[6px] bg-champagne/10 relative overflow-hidden">
                          <div className="h-full bg-champagne" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ label, value, sublabel, highlight }:
  { label: string; value: number | string; sublabel?: string; highlight?: boolean }) {
  return (
    <div className={`border ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15"} px-4 py-4`}>
      <p className="text-cream/40 text-[10px] uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-cream font-display italic text-2xl md:text-3xl tabular-nums">{value}</p>
      {sublabel && <p className="text-cream/40 text-[10px] mt-1 tabular-nums">{sublabel}</p>}
    </div>
  );
}

function FunnelStep({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-cream font-display italic text-3xl md:text-4xl tabular-nums">{value}</p>
      <p className="text-cream/50 text-[10px] uppercase tracking-[0.2em] mt-2">{label}</p>
    </div>
  );
}
