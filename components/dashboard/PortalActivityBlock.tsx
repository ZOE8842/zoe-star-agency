// Admin-only Portal-Aktivitaets-Block.
// Aggregiert admin_analytics_events fuer:
//   - Besucher heute / Monat (distinct session_id, event_type='page_view')
//   - Logins heute / Monat (count event_type='login_success')
//   - Aktive Nutzer heute / Monat (distinct user_id where user_id not null)
// Plus Tabelle: letzte 15 Login-Events (Nutzer, Rolle, letzter Pfad).
//
// Renders nichts wenn role !== 'admin'.

import { createClient } from "@/lib/supabase/server";

function isoStartOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function isoStartOfMonth(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.toISOString();
}

interface ActivityRow {
  user_id: string;
  display_name: string | null;
  tiktok_username: string | null;
  role: string | null;
  last_login: string;
  last_path: string | null;
  views_today: number;
  views_month: number;
}

export async function PortalActivityBlock({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;

  const supabase = await createClient();
  const today = isoStartOfToday();
  const monthStart = isoStartOfMonth();

  // Helper: count distinct session_id per zeitfenster
  // Supabase JS hat keine direkte distinct-count - wir holen session_ids + dedupen client-side.

  const [
    pvTodayRes,
    pvMonthRes,
    loginsTodayRes,
    loginsMonthRes,
    activeTodayRes,
    activeMonthRes,
    lastLoginsRes,
  ] = await Promise.all([
    supabase.from("admin_analytics_events")
      .select("session_id")
      .eq("event_type", "page_view")
      .gte("created_at", today),
    supabase.from("admin_analytics_events")
      .select("session_id")
      .eq("event_type", "page_view")
      .gte("created_at", monthStart),
    supabase.from("admin_analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "login_success")
      .gte("created_at", today),
    supabase.from("admin_analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "login_success")
      .gte("created_at", monthStart),
    supabase.from("admin_analytics_events")
      .select("user_id")
      .not("user_id", "is", null)
      .gte("created_at", today),
    supabase.from("admin_analytics_events")
      .select("user_id")
      .not("user_id", "is", null)
      .gte("created_at", monthStart),
    supabase.from("admin_analytics_events")
      .select("user_id, role, path, created_at")
      .eq("event_type", "login_success")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const distinctSessions = (rows: { session_id: string | null }[] | null): number => {
    if (!rows) return 0;
    const s = new Set<string>();
    for (const r of rows) if (r.session_id) s.add(r.session_id);
    return s.size;
  };
  const distinctUsers = (rows: { user_id: string | null }[] | null): number => {
    if (!rows) return 0;
    const s = new Set<string>();
    for (const r of rows) if (r.user_id) s.add(r.user_id);
    return s.size;
  };

  const visitorsToday = distinctSessions(pvTodayRes.data);
  const visitorsMonth = distinctSessions(pvMonthRes.data);
  const loginsToday = loginsTodayRes.count ?? 0;
  const loginsMonth = loginsMonthRes.count ?? 0;
  const activeToday = distinctUsers(activeTodayRes.data);
  const activeMonth = distinctUsers(activeMonthRes.data);

  // Tabelle: letzte 15 unique-user Logins
  const loginRows = lastLoginsRes.data ?? [];
  const seenUsers = new Set<string>();
  const lastByUser: { user_id: string; role: string | null; path: string | null; created_at: string }[] = [];
  for (const r of loginRows) {
    if (!r.user_id || seenUsers.has(r.user_id)) continue;
    seenUsers.add(r.user_id);
    lastByUser.push(r as typeof lastByUser[number]);
    if (lastByUser.length >= 15) break;
  }

  // Profile-Infos (display_name, tiktok_username) + Aktivitaets-Counts
  let rows: ActivityRow[] = [];
  if (lastByUser.length > 0) {
    const ids = lastByUser.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, tiktok_username")
      .in("id", ids);

    // page_views pro user heute+monat (in einem Schwung)
    const [todayViewsRes, monthViewsRes] = await Promise.all([
      supabase.from("admin_analytics_events")
        .select("user_id")
        .eq("event_type", "page_view")
        .in("user_id", ids)
        .gte("created_at", today),
      supabase.from("admin_analytics_events")
        .select("user_id")
        .eq("event_type", "page_view")
        .in("user_id", ids)
        .gte("created_at", monthStart),
    ]);
    const countsToday = new Map<string, number>();
    const countsMonth = new Map<string, number>();
    for (const r of (todayViewsRes.data ?? [])) {
      if (r.user_id) countsToday.set(r.user_id, (countsToday.get(r.user_id) ?? 0) + 1);
    }
    for (const r of (monthViewsRes.data ?? [])) {
      if (r.user_id) countsMonth.set(r.user_id, (countsMonth.get(r.user_id) ?? 0) + 1);
    }

    const profMap = new Map<string, { display_name: string | null; tiktok_username: string | null }>();
    for (const p of (profiles ?? [])) profMap.set(p.id, p as { display_name: string | null; tiktok_username: string | null });

    rows = lastByUser.map(r => {
      const p = profMap.get(r.user_id);
      return {
        user_id: r.user_id,
        display_name: p?.display_name ?? null,
        tiktok_username: p?.tiktok_username ?? null,
        role: r.role,
        last_login: r.created_at,
        last_path: r.path,
        views_today: countsToday.get(r.user_id) ?? 0,
        views_month: countsMonth.get(r.user_id) ?? 0,
      };
    });
  }

  return (
    <section className="mb-12">
      <p className="eyebrow mb-4">Portal-Aktivitaet</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard label="Besucher heute" value={visitorsToday} />
        <MetricCard label="Besucher Monat" value={visitorsMonth} />
        <MetricCard label="Logins heute" value={loginsToday} />
        <MetricCard label="Logins Monat" value={loginsMonth} />
        <MetricCard label="Aktive Nutzer heute" value={activeToday} />
        <MetricCard label="Aktive Nutzer Monat" value={activeMonth} />
      </div>

      <div className="border border-champagne/15">
        <div className="flex items-baseline justify-between px-4 py-3 border-b border-champagne/10">
          <p className="text-cream/80 text-[11px] uppercase tracking-[0.25em]">Letzte Portal-Aktivitaet</p>
          <p className="text-cream/40 text-[10px]">{rows.length} Nutzer</p>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-cream/40 text-sm">Noch keine Aktivitaet aufgezeichnet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-cream/40 text-[10px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="text-left px-4 py-3 font-normal">Nutzer</th>
                  <th className="text-left px-4 py-3 font-normal">Rolle</th>
                  <th className="text-left px-4 py-3 font-normal">Letzter Login</th>
                  <th className="text-left px-4 py-3 font-normal">Letzter Pfad</th>
                  <th className="text-right px-4 py-3 font-normal">Heute</th>
                  <th className="text-right px-4 py-3 font-normal">Monat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-t border-champagne/5">
                    <td className="px-4 py-3 text-cream">
                      <div>{r.display_name || "—"}</div>
                      {r.tiktok_username && <div className="text-cream/40 text-xs">@{r.tiktok_username}</div>}
                    </td>
                    <td className="px-4 py-3 text-cream/70 text-xs uppercase tracking-wider">{r.role ?? "—"}</td>
                    <td className="px-4 py-3 text-cream/60 text-xs">
                      {new Date(r.last_login).toLocaleString("de-DE", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-cream/50 text-xs truncate max-w-[280px]" title={r.last_path ?? ""}>
                      {r.last_path ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-cream tabular-nums">{r.views_today}</td>
                    <td className="px-4 py-3 text-right text-cream/70 tabular-nums">{r.views_month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-champagne/15 px-4 py-4">
      <p className="text-cream/40 text-[10px] uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-cream font-display italic text-2xl md:text-3xl tabular-nums">{value}</p>
    </div>
  );
}
