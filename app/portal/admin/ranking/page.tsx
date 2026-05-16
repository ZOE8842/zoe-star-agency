import { createClient } from "@supabase/supabase-js";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { key: "diamonds_month",      label: "Diamanten" },
  { key: "valid_live_days",     label: "LIVE-Tage" },
  { key: "live_minutes_total",  label: "LIVE-Minuten" },
  { key: "average_viewers",     label: "Ø Zuschauer" },
  { key: "gift_rate",           label: "Geschenkquote" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

interface Row {
  profile_id: string;
  tiktok_username: string;
  display_name: string | null;
  avatar_url: string | null;
  valid_live_days: number;
  live_minutes_total: number;
  live_hours_display: number | null;
  average_viewers: number;
  last_live_date: string | null;
  activity_status: "aktiv" | "unregelmaessig" | "inaktiv" | null;
  diamonds_month: number | null;
  gift_rate: number | null;
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

function formatHours(min: number, display: number | null): string {
  if (display != null) return `${display.toString().replace(".", ",")}h`;
  if (min <= 0) return "0h";
  return `${(min / 60).toFixed(1).replace(".", ",")}h`;
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function statusBadge(s: Row["activity_status"]): { label: string; cls: string } {
  if (s === "aktiv") return { label: "aktiv", cls: "bg-champagne/15 text-champagne border border-champagne/40" };
  if (s === "unregelmaessig") return { label: "unregelmäßig", cls: "border border-champagne/30 text-champagne/80" };
  if (s === "inaktiv") return { label: "inaktiv", cls: "border border-cream/20 text-cream/45" };
  return { label: "—", cls: "border border-cream/15 text-cream/35" };
}

interface PageProps {
  searchParams: Promise<{ sort?: string; dir?: string }>;
}

export default async function AdminRankingPage({ searchParams }: PageProps) {
  const { profile } = await requireManagerOrAdmin();
  const sp = await searchParams;
  const sortKey: SortKey =
    (SORT_OPTIONS.find((o) => o.key === sp.sort)?.key) ?? "diamonds_month";
  const sortDir: "asc" | "desc" = sp.dir === "asc" ? "asc" : "desc";

  const db = sr();
  const month = currentMonthIso();

  // Service-Role-Read: alle Mai-Metrics + Profil-Daten
  const { data: metrics } = await db
    .from("creator_monthly_metrics")
    .select(
      "profile_id, tiktok_username, valid_live_days, live_minutes_total, live_hours_display, average_viewers, last_live_date, activity_status, diamonds_month, gift_rate",
    )
    .eq("month", month);

  // Profile-Lookup für display_name + avatar (Service-Role um RLS zu umgehen,
  // hart auf profile_ids aus den Metrics gefiltert)
  const profileIds = (metrics ?? []).map((m) => m.profile_id);
  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", profileIds.length > 0 ? profileIds : [""]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const rows: Row[] = (metrics ?? []).map((m) => {
    const p = profileMap.get(m.profile_id);
    return {
      profile_id: m.profile_id,
      tiktok_username: m.tiktok_username,
      display_name: p?.display_name ?? null,
      avatar_url: p?.avatar_url ?? null,
      valid_live_days: m.valid_live_days,
      live_minutes_total: m.live_minutes_total,
      live_hours_display: m.live_hours_display,
      average_viewers: m.average_viewers,
      last_live_date: m.last_live_date,
      activity_status: m.activity_status,
      diamonds_month: m.diamonds_month,
      gift_rate: m.gift_rate,
    };
  });

  // Sortierung
  rows.sort((a, b) => {
    const av = (a[sortKey] ?? 0) as number;
    const bv = (b[sortKey] ?? 0) as number;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const monthLabel = new Date(month).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />
      <main className="container-luxe py-10 md:py-16">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <p className="eyebrow mb-2">Admin · Ranking</p>
            <h1 className="heading-display text-cream text-3xl md:text-4xl">
              Creator-Ranking · {monthLabel}
            </h1>
            <p className="text-cream/50 text-sm mt-2">
              {rows.length} Creator · sortiert nach{" "}
              <span className="text-champagne">
                {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
              </span>{" "}
              ({sortDir === "desc" ? "absteigend" : "aufsteigend"})
            </p>
          </div>
        </div>

        {/* Sort-Toolbar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SORT_OPTIONS.map((o) => {
            const active = o.key === sortKey;
            const nextDir = active && sortDir === "desc" ? "asc" : "desc";
            return (
              <a
                key={o.key}
                href={`?sort=${o.key}&dir=${active ? nextDir : "desc"}`}
                className={`text-[11px] uppercase tracking-[0.2em] px-3 py-1.5 transition-all ${
                  active
                    ? "bg-champagne text-ink"
                    : "border border-champagne/30 text-cream/70 hover:border-champagne hover:text-champagne"
                }`}
              >
                {o.label} {active ? (sortDir === "desc" ? "↓" : "↑") : ""}
              </a>
            );
          })}
        </div>

        {/* Tabelle */}
        {rows.length === 0 ? (
          <div className="border border-champagne/15 p-7 text-center">
            <p className="text-cream/55">
              Noch keine Daten für {monthLabel}. Sobald der Autopilot lief (täglich 08:45 Berlin), erscheint hier die Rangliste.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-champagne/15">
            <table className="w-full text-sm">
              <thead className="bg-champagne/5">
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-cream/55">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Creator</th>
                  <th className="px-4 py-3 text-right">Tage</th>
                  <th className="px-4 py-3 text-right">LIVE-Std</th>
                  <th className="px-4 py-3 text-right">Ø Zuschauer</th>
                  <th className="px-4 py-3 text-right">💎</th>
                  <th className="px-4 py-3 text-right">Geschenkrate</th>
                  <th className="px-4 py-3 text-right">Letzter LIVE</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const b = statusBadge(r.activity_status);
                  return (
                    <tr
                      key={r.profile_id}
                      className="border-t border-champagne/10 hover:bg-champagne/[0.03]"
                    >
                      <td className="px-4 py-3 text-cream/40 font-display italic text-base">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-cream font-medium">
                          {r.display_name || r.tiktok_username}
                        </div>
                        <div className="text-cream/45 text-xs">
                          @{r.tiktok_username}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-cream/80">
                        {r.valid_live_days}
                      </td>
                      <td className="px-4 py-3 text-right text-cream/80">
                        {formatHours(r.live_minutes_total, r.live_hours_display)}
                      </td>
                      <td className="px-4 py-3 text-right text-cream/80">
                        {r.average_viewers.toLocaleString("de-DE")}
                      </td>
                      <td className="px-4 py-3 text-right text-champagne">
                        {r.diamonds_month != null
                          ? r.diamonds_month.toLocaleString("de-DE")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-cream/80">
                        {r.gift_rate != null
                          ? `${r.gift_rate.toString().replace(".", ",")} %`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-cream/60">
                        {formatDate(r.last_live_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${b.cls}`}
                        >
                          {b.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
