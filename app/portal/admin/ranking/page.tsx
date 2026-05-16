import { createClient } from "@supabase/supabase-js";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

// /portal/admin/ranking — V5 (2026-05-16)
//
// REGEL (User-Decision):
//   Zeige ALLE Creator-Profile mit gueltigem TikTok-Handle, egal ob
//   Onboarding abgeschlossen ist oder nicht — Backstage-Daten werden
//   ohnehin gescraped (siehe /api/sync/backstage-creators).
//   Ranking ist die Admin-Sicht auf den vollstaendigen Creator-Pool.
//
//   Ausschluss-Set: 'ray_star_agency' (dauerhaft excluded).
//   Status = 'deleted' wird ausgeblendet.
//
// Anzeige pro Zeile:
//   Creator-Name + TikTok-Handle
//   Portal-Status   (active / inactive)
//   Onboarding      (onboarded / not_onboarded)
//   Backstage       (synced / missing_backstage)
//   LIVE-Tage, LIVE-Stunden, Ø Zuschauer, Diamanten, Geschenkrate,
//   Letzter LIVE, Activity-Status
//
// Sortierung: erst nach Sortier-Key (default Diamanten desc), Creator ohne
// Daten landen am Ende (sortKey-Wert = 0 / null).

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
  tiktok_handle_normalized: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  onboarding_completed: boolean;
  has_backstage: boolean;
  // Mai-Metrics — null wenn missing_backstage
  valid_live_days: number;
  live_minutes_total: number;
  live_hours_display: number | null;
  average_viewers: number;
  last_live_date: string | null;
  activity_status: "aktiv" | "unregelmaessig" | "inaktiv" | null;
  diamonds_month: number | null;
  gift_rate: number | null;
}

const EXCLUDED_HANDLES = new Set<string>(["ray_star_agency"]);

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

function statusBadge(s: Row["activity_status"], hasBackstage: boolean):
  { label: string; cls: string } {
  if (!hasBackstage) return { label: "kein Sync", cls: "border border-cream/15 text-cream/35" };
  if (s === "aktiv") return { label: "aktiv", cls: "bg-champagne/15 text-champagne border border-champagne/40" };
  if (s === "unregelmaessig") return { label: "unregelmäßig", cls: "border border-champagne/30 text-champagne/80" };
  if (s === "inaktiv") return { label: "inaktiv", cls: "border border-cream/20 text-cream/45" };
  return { label: "—", cls: "border border-cream/15 text-cream/35" };
}

function portalBadge(s: string): { label: string; cls: string } {
  if (s === "active") return { label: "Portal aktiv", cls: "border border-champagne/30 text-champagne/80" };
  if (s === "inactive") return { label: "Portal inaktiv", cls: "border border-cream/20 text-cream/45" };
  return { label: s, cls: "border border-cream/15 text-cream/35" };
}

function onboardingBadge(done: boolean): { label: string; cls: string } {
  return done
    ? { label: "onboarded", cls: "border border-champagne/30 text-champagne/80" }
    : { label: "pending", cls: "border border-yellow-400/40 text-yellow-300/85" };
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

  // 1) Alle Creator-Profile mit gueltigem Handle, nicht-deleted, nicht excluded
  const { data: profiles } = await db
    .from("profiles")
    .select("id, tiktok_username, tiktok_handle_normalized, display_name, avatar_url, status, onboarding_completed")
    .eq("role", "creator")
    .neq("status", "deleted")
    .not("tiktok_handle_normalized", "is", null);

  const eligible = (profiles ?? []).filter(
    (p) => !EXCLUDED_HANDLES.has((p.tiktok_handle_normalized ?? "").toLowerCase()),
  );
  const eligibleIds = eligible.map((p) => p.id);

  // 2) Alle Mai-Metrics fuer diese Profile
  const { data: metrics } = await db
    .from("creator_monthly_metrics")
    .select(
      "profile_id, valid_live_days, live_minutes_total, live_hours_display, average_viewers, last_live_date, activity_status, diamonds_month, gift_rate",
    )
    .eq("month", month)
    .in("profile_id", eligibleIds.length > 0 ? eligibleIds : [""]);

  const metricsMap = new Map((metrics ?? []).map((m) => [m.profile_id, m]));

  const rows: Row[] = eligible.map((p) => {
    const m = metricsMap.get(p.id);
    return {
      profile_id: p.id,
      tiktok_username: p.tiktok_username ?? "",
      tiktok_handle_normalized: p.tiktok_handle_normalized ?? "",
      display_name: p.display_name ?? null,
      avatar_url: p.avatar_url ?? null,
      status: p.status ?? "active",
      onboarding_completed: !!p.onboarding_completed,
      has_backstage: !!m,
      valid_live_days: m?.valid_live_days ?? 0,
      live_minutes_total: m?.live_minutes_total ?? 0,
      live_hours_display: m?.live_hours_display ?? null,
      average_viewers: m?.average_viewers ?? 0,
      last_live_date: m?.last_live_date ?? null,
      activity_status: (m?.activity_status as Row["activity_status"]) ?? null,
      diamonds_month: m?.diamonds_month ?? null,
      gift_rate: m?.gift_rate ?? null,
    };
  });

  // Sortierung: Creator MIT Backstage-Daten oben, dann nach Key
  rows.sort((a, b) => {
    if (a.has_backstage !== b.has_backstage) return a.has_backstage ? -1 : 1;
    const av = (a[sortKey] ?? 0) as number;
    const bv = (b[sortKey] ?? 0) as number;
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const monthLabel = new Date(month).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  const totalRows = rows.length;
  const withData = rows.filter((r) => r.has_backstage).length;
  const onboardedCount = rows.filter((r) => r.onboarding_completed).length;
  const pendingOnboarding = totalRows - onboardedCount;

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
              {totalRows} Creator · {withData} mit Backstage-Daten · {pendingOnboarding} ohne Onboarding · sortiert nach{" "}
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
              Keine Creator gefunden.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-champagne/15">
            <table className="w-full text-sm">
              <thead className="bg-champagne/5">
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-cream/55">
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Creator</th>
                  <th className="px-3 py-3 text-center">Portal</th>
                  <th className="px-3 py-3 text-center">Onboarding</th>
                  <th className="px-3 py-3 text-right">Tage</th>
                  <th className="px-3 py-3 text-right">LIVE-Std</th>
                  <th className="px-3 py-3 text-right">Ø Zuschauer</th>
                  <th className="px-3 py-3 text-right">💎</th>
                  <th className="px-3 py-3 text-right">Geschenkrate</th>
                  <th className="px-3 py-3 text-right">Letzter LIVE</th>
                  <th className="px-3 py-3 text-center">Activity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const b = statusBadge(r.activity_status, r.has_backstage);
                  const pb = portalBadge(r.status);
                  const ob = onboardingBadge(r.onboarding_completed);
                  const muted = !r.has_backstage;
                  return (
                    <tr
                      key={r.profile_id}
                      className={`border-t border-champagne/10 hover:bg-champagne/[0.03] ${
                        muted ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-cream/40 font-display italic text-base">
                        {r.has_backstage ? i + 1 : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-cream font-medium">
                          {r.display_name || r.tiktok_username}
                        </div>
                        <div className="text-cream/45 text-xs">
                          @{r.tiktok_username}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${pb.cls}`}>
                          {pb.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${ob.cls}`}>
                          {ob.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-cream/80">
                        {r.has_backstage ? r.valid_live_days : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-cream/80">
                        {r.has_backstage
                          ? formatHours(r.live_minutes_total, r.live_hours_display)
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-cream/80">
                        {r.has_backstage ? r.average_viewers.toLocaleString("de-DE") : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-champagne">
                        {r.diamonds_month != null
                          ? r.diamonds_month.toLocaleString("de-DE")
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-cream/80">
                        {r.gift_rate != null
                          ? `${r.gift_rate.toString().replace(".", ",")} %`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-cream/60">
                        {formatDate(r.last_live_date)}
                      </td>
                      <td className="px-3 py-3 text-center">
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

        <p className="text-cream/35 text-xs mt-6 leading-relaxed max-w-3xl">
          Zeile = Creator mit gueltigem TikTok-Handle.
          „Portal" = ob das Konto aktiv im Portal ist.
          „Onboarding" = ob der Creator den Onboarding-Flow durchlaufen hat.
          „kein Sync" = noch keine Backstage-Daten in diesem Monat (z.B. neu, noch nicht gescraped, oder kein Match in Backstage gefunden).
          Aktualisierung: taeglich ca. 08:45 Berlin via Backstage-Autopilot.
        </p>
      </main>
    </>
  );
}
