import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalNav } from "@/components/PortalNav";
import { NewsFeed } from "@/components/dashboard/NewsFeed";
import { PortalActivityBlock } from "@/components/dashboard/PortalActivityBlock";
import { WebsiteAnalyticsBlock } from "@/components/dashboard/WebsiteAnalyticsBlock";
import { loadLocale, greetingKey } from "@/lib/i18n";

// V2-A · Format-Helpers für Top-Block (USD + BigInt)
function fmtUsdNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
}
function fmtBigIntNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2).replace(".", ",")}M`;
  if (v >= 1_000) return `${Math.round(v / 100) / 10}k`.replace(".", ",");
  return v.toString();
}

// V2-A · Compute-Row-Subset für Top-Block
interface AdminComputeRow {
  tiktok_username: string;
  ist_estimated_bonus_usd: number | null;
  live_current_diamonds: number | null;
  live_valid_days: number | null;
  live_duration_seconds: number | null;
  ist_tier_level: number | null;
  ist_activity_level: number | null;
  days_to_next_activity_level: number | null;
  max_diamonds_to_next_tier: number | null;
  trend_class: "wachsend" | "stabil" | "fallend" | "new_creator" | "unknown" | null;
  meta_is_new_creator: boolean | null;
  real_projected_bonus_usd_eom: number | null;
  hist_3m_avg_total: number | null;
  data_completeness: string;
}

// Greeting jetzt locale-aware - definiert innerhalb AdminPage via loadLocale().

function startOfWeekIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=So
  const diff = day === 0 ? -6 : 1 - day; // Montag als Wochenstart
  d.setDate(d.getDate() + diff);
  return d.toISOString();
}

function threadKey(a: string | null, b: string | null, subject: string | null): string {
  const x = a ?? "";
  const y = b ?? "";
  const pair = x < y ? `${x}|${y}` : `${y}|${x}`;
  const subj = (subject ?? "").replace(/^(re:\s*)+/i, "").trim().toLowerCase();
  return `${pair}::${subj}`;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  if (!profile || !["manager", "admin"].includes(profile.role)) redirect("/portal");
  const isAdmin = profile.role === "admin";

  // i18n: Greeting locale-aware via profile.language
  const { t } = await loadLocale();
  const greeting = () => t(greetingKey(new Date().getHours()));

  const now = new Date();

  // Bei Manager: alle Creator-Queries auf manager_id = self scopen
  const scopedProfiles = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "creator")
    .eq("status", "active");

  const [
    totalUsersRes,
    activeCreatorsRes,
    openTicketsRes,
    openInvitesRes,
    upcomingEventsRes,
    recentSignupsRes,
    recentInvitesRes,
    recentTicketsRes,
  ] = await Promise.all([
    isAdmin
      ? supabase.from("profiles").select("id", { count: "exact", head: true })
      : supabase.from("profiles").select("id", { count: "exact", head: true }).eq("manager_id", profile.id),
    isAdmin ? scopedProfiles : scopedProfiles.eq("manager_id", profile.id),
    isAdmin
      ? supabase.from("support_tickets").select("id", { count: "exact", head: true })
          .in("status", ["open", "in_progress"])
      : Promise.resolve({ count: 0 }),
    isAdmin
      ? supabase.from("invites").select("id", { count: "exact", head: true }).is("used_at", null)
      : Promise.resolve({ count: 0 }),
    supabase.from("events").select("id", { count: "exact", head: true })
      .eq("status", "open").gte("start_at", now.toISOString()),
    isAdmin
      ? supabase.from("profiles")
          .select("id, display_name, tiktok_username, role, joined_at, avatar_url")
          .order("joined_at", { ascending: false }).limit(5)
      : supabase.from("profiles")
          .select("id, display_name, tiktok_username, role, joined_at, avatar_url")
          .eq("manager_id", profile.id)
          .order("joined_at", { ascending: false }).limit(5),
    isAdmin
      ? supabase.from("invites")
          .select("id, code, intended_role, used_at, expires_at, created_at")
          .order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("support_tickets")
          .select("id, subject, status, created_at, creator_id")
          .order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const activeCreators = activeCreatorsRes.count ?? 0;
  const openTickets = openTicketsRes.count ?? 0;
  const openInvites = openInvitesRes.count ?? 0;
  const upcomingEvents = upcomingEventsRes.count ?? 0;
  const recentSignups = recentSignupsRes.data ?? [];
  const recentInvites = recentInvitesRes.data ?? [];
  const recentTickets = recentTicketsRes.data ?? [];

  // OPERATIONS-OVERVIEW · alle offenen Anfragen / Reviews zentral
  // Admin-only, kein Manager-Scoping noetig.
  let ops = {
    creators_pending: 0,
    tiktok_push: 0,
    phone_request: 0,
    live_absence: 0,
    content_helper: 0,
    big_match: 0,
    account_analyse: 0,
    live_report: 0,
    showcase_pending: 0,
    dm_queue: 0,
    dm_failed: 0,
  };
  if (isAdmin) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [
      pendingRes, pushRes, phoneRes, absRes, contentRes, matchRes,
      aaRes, lpRes, showcaseRes, dmQueueRes, dmFailRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { head: true, count: "exact" })
        .eq("role", "creator").eq("status", "pending")
        .eq("onboarding_completed", true),
      supabase.from("tiktok_push_requests").select("id", { head: true, count: "exact" })
        .eq("status", "submitted"),
      supabase.from("phone_call_requests").select("id", { head: true, count: "exact" })
        .eq("status", "open"),
      supabase.from("live_absences").select("id", { head: true, count: "exact" })
        .eq("status", "submitted"),
      supabase.from("content_reviews").select("id", { head: true, count: "exact" })
        .in("status", ["submitted", "queued", "processing"]),
      supabase.from("match_requests").select("id", { head: true, count: "exact" })
        .in("status", ["requested", "in_review", "partner_found"]),
      supabase.from("account_analyses").select("id", { head: true, count: "exact" })
        .in("status", ["submitted", "queued", "processing"]),
      supabase.from("live_performance_reports").select("id", { head: true, count: "exact" })
        .in("status", ["submitted", "queued", "processing"]),
      supabase.from("showcase_creators").select("id", { head: true, count: "exact" })
        .eq("is_approved", false),
      supabase.from("platform_notifications").select("id", { head: true, count: "exact" })
        .eq("status", "queued"),
      supabase.from("platform_notifications").select("id", { head: true, count: "exact" })
        .eq("status", "failed"),
    ]);
    ops = {
      creators_pending: pendingRes.count ?? 0,
      tiktok_push: pushRes.count ?? 0,
      phone_request: phoneRes.count ?? 0,
      live_absence: absRes.count ?? 0,
      content_helper: contentRes.count ?? 0,
      big_match: matchRes.count ?? 0,
      account_analyse: aaRes.count ?? 0,
      live_report: lpRes.count ?? 0,
      showcase_pending: showcaseRes.count ?? 0,
      dm_queue: dmQueueRes.count ?? 0,
      dm_failed: dmFailRes.count ?? 0,
    };
  }
  const opsTotal = Object.values(ops).reduce((s, n) => s + n, 0);

  // V2-A · Top-Block-Daten · v_creator_incentive_compute (admin-only, aktueller Monat)
  const currentMonthIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  })();
  let topBlockRows: AdminComputeRow[] = [];
  if (isAdmin) {
    const { data: cRows } = await supabase
      .from("v_creator_incentive_compute")
      .select("tiktok_username, ist_estimated_bonus_usd, live_current_diamonds, live_valid_days, live_duration_seconds, ist_tier_level, ist_activity_level, days_to_next_activity_level, max_diamonds_to_next_tier, trend_class, meta_is_new_creator, real_projected_bonus_usd_eom, hist_3m_avg_total, data_completeness")
      .eq("period_month", currentMonthIso)
      .eq("data_completeness", "sot_live");
    topBlockRows = (cRows ?? []) as unknown as AdminComputeRow[];
  }

  // INBOX-WAITING — Threads, deren letzte Message von Non-Admin an Admin ging
  let inboxWaiting = 0;
  // KPI-Block: Diese-Woche-Counts + Anthropic-Cost
  let kpi = {
    reviews_done: 0,
    push_selected: 0,
    matches_planned: 0,
    cost_usd: 0,
    avg_review_minutes: 0,
  };
  if (isAdmin) {
    const weekStart = startOfWeekIso();
    const [
      recentMsgsRes,
      adminsRes,
      reviewsDoneRes,
      pushSelectedRes,
      matchesPlannedRes,
      costContentRes,
      costAccountRes,
      reviewSpeedRes,
    ] = await Promise.all([
      supabase.from("messages")
        .select("id, sender_id, recipient_id, recipient_group, subject")
        .order("sent_at", { ascending: false })
        .limit(150),
      supabase.from("profiles").select("id").eq("role", "admin"),
      supabase.from("content_reviews")
        .select("id", { head: true, count: "exact" })
        .in("status", ["done", "reviewed"])
        .gte("reviewed_at", weekStart),
      supabase.from("tiktok_push_requests")
        .select("id", { head: true, count: "exact" })
        .eq("status", "selected")
        .gte("created_at", weekStart),
      supabase.from("match_requests")
        .select("id", { head: true, count: "exact" })
        .in("status", ["planned", "done"])
        .gte("created_at", weekStart),
      supabase.from("content_reviews")
        .select("cost_usd")
        .gte("created_at", weekStart)
        .not("cost_usd", "is", null),
      supabase.from("account_analyses")
        .select("cost_usd")
        .gte("created_at", weekStart)
        .not("cost_usd", "is", null),
      supabase.from("content_reviews")
        .select("created_at, reviewed_at")
        .in("status", ["done", "reviewed"])
        .gte("reviewed_at", weekStart)
        .not("reviewed_at", "is", null)
        .limit(50),
    ]);

    const adminIds = new Set((adminsRes.data ?? []).map((a) => a.id));
    const seen = new Set<string>();
    for (const m of recentMsgsRes.data ?? []) {
      if (m.recipient_group != null || !m.sender_id || !m.recipient_id) continue;
      const k = threadKey(m.sender_id, m.recipient_id, m.subject);
      if (seen.has(k)) continue;
      seen.add(k);
      if (!adminIds.has(m.sender_id) && adminIds.has(m.recipient_id)) {
        inboxWaiting++;
      }
    }

    const sumCost = (rows: { cost_usd: unknown }[] | null | undefined) =>
      (rows ?? []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);
    const totalCost = sumCost(costContentRes.data as { cost_usd: unknown }[] | null)
      + sumCost(costAccountRes.data as { cost_usd: unknown }[] | null);

    const speeds = (reviewSpeedRes.data ?? [])
      .map((r) => {
        const created = r.created_at ? new Date(r.created_at).getTime() : 0;
        const reviewed = r.reviewed_at ? new Date(r.reviewed_at).getTime() : 0;
        return reviewed > created ? (reviewed - created) / 60000 : null;
      })
      .filter((n): n is number => n !== null);
    const avgMin = speeds.length > 0
      ? Math.round(speeds.reduce((s, n) => s + n, 0) / speeds.length)
      : 0;

    kpi = {
      reviews_done: reviewsDoneRes.count ?? 0,
      push_selected: pushSelectedRes.count ?? 0,
      matches_planned: matchesPlannedRes.count ?? 0,
      cost_usd: Number(totalCost.toFixed(2)),
      avg_review_minutes: avgMin,
    };
  }

  // CRON-HEALTH — letzter Eintrag pro source (+ optional kind)
  // Enum-Quellen: 'apify_tiktok', 'backstage_sync', 'claude_worker'.
  // claude_worker hat zwei Sub-Sources (kind=content_image vs kind=content_cleanup
  // etc.) — wir tracken die wichtigsten zwei.
  type HealthRow = {
    source: string;
    kind: string | null;
    ok: boolean;
    duration_ms: number | null;
    error_message: string | null;
    created_at: string;
  };
  let cronHealth: Array<{
    label: string;
    state: "ok" | "warn" | "fail" | "missing";
    lastRun: string | null;
    detail: string | null;
  }> = [];
  if (isAdmin) {
    const since48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const { data: hRows } = await supabase
      .from("data_source_health")
      .select("source, kind, ok, duration_ms, error_message, created_at")
      .gte("created_at", since48h)
      .order("created_at", { ascending: false })
      .limit(200);
    const rows = (hRows as HealthRow[] | null) ?? [];

    // Helper: hole letzten Eintrag fuer (source, kindPattern)
    function latest(source: string, kindStartsWith?: string): HealthRow | null {
      for (const r of rows) {
        if (r.source !== source) continue;
        if (kindStartsWith && !(r.kind ?? "").startsWith(kindStartsWith)) continue;
        return r;
      }
      return null;
    }

    function asHealth(label: string, row: HealthRow | null, maxAgeHours: number): typeof cronHealth[number] {
      if (!row) return { label, state: "missing", lastRun: null, detail: "Kein Eintrag in 48h" };
      const ageHours = (Date.now() - new Date(row.created_at).getTime()) / 3600_000;
      const state: "ok" | "warn" | "fail" =
        !row.ok ? "fail" : ageHours > maxAgeHours ? "warn" : "ok";
      const ageLabel = ageHours < 1
        ? `${Math.round(ageHours * 60)} min`
        : ageHours < 24
        ? `${Math.round(ageHours)} h`
        : `${(ageHours / 24).toFixed(1)} t`;
      return {
        label,
        state,
        lastRun: ageLabel,
        detail: row.error_message || (row.duration_ms ? `${(row.duration_ms / 1000).toFixed(1)} s` : null),
      };
    }

    cronHealth = [
      asHealth("Analyse-Worker", latest("claude_worker", "content_image"), 26),
      asHealth("Account-Analyse", latest("claude_worker", "account"), 26),
      asHealth("LIVE-Report", latest("claude_worker", "live"), 26),
      asHealth("Content-Cleanup", latest("claude_worker", "content_cleanup"), 26),
      asHealth("Apify TikTok", latest("apify_tiktok"), 26),
      asHealth("Backstage-Sync", latest("backstage_sync"), 26),
    ];
  }

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        isManager={!isAdmin}
      />

      <main className="container-luxe py-12 md:py-20">
        {/* ═══ V2-A · TOP-BLOCK · HEUTE WICHTIG + NETWORK OVERVIEW ═══ */}
        {isAdmin && topBlockRows.length > 0 && (() => {
          // ──────────────────────────────────────────────────────────
          // Aggregate für Network-Overview
          // ──────────────────────────────────────────────────────────
          const sotLive = topBlockRows;
          const networkIst = sotLive.reduce((s, c) => s + (Number(c.ist_estimated_bonus_usd) || 0), 0);
          const networkReal = sotLive.reduce((s, c) => s + (Number(c.real_projected_bonus_usd_eom) || 0), 0);
          const networkHistAvg = sotLive.reduce((s, c) => s + (Number(c.hist_3m_avg_total) || 0), 0);
          const eligibleCount = sotLive.filter((c) =>
            (c.live_valid_days ?? 0) >= 7 && (c.live_duration_seconds ?? 0) >= 15 * 3600
          ).length;
          const wachsendCount = sotLive.filter((c) => c.trend_class === "wachsend").length;
          const fallendCount = sotLive.filter((c) => c.trend_class === "fallend").length;
          // Goal-Ring: REAL_EOM gegen historischen 3M-Schnitt als implicit goal
          const goalPct = networkHistAvg > 0
            ? Math.min(120, Math.round((networkReal / networkHistAvg) * 100))
            : null;

          // ──────────────────────────────────────────────────────────
          // Top-Prioritäten · operativ, max 7
          // ──────────────────────────────────────────────────────────
          type Prio = {
            username: string;
            primary: string;
            secondary: string;
            weight: number;
            accent?: "warm" | "neutral";
          };
          const all: Prio[] = [];
          for (const c of sotLive) {
            const istZero = (Number(c.ist_estimated_bonus_usd) || 0) === 0;
            const hasDiamonds = (Number(c.live_current_diamonds) || 0) > 100_000;
            const days = c.live_valid_days ?? 0;
            const secs = c.live_duration_seconds ?? 0;
            const daysMissing = Math.max(0, 7 - days);
            const hoursMissing = Math.ceil(Math.max(0, 15 * 3600 - secs) / 3600);
            const eligible = daysMissing === 0 && hoursMissing === 0;
            // 1 · Eligibility fast erreicht (höchste Prio)
            if (istZero && hasDiamonds && !eligible && (daysMissing <= 1 && hoursMissing <= 1)) {
              const parts: string[] = [];
              if (daysMissing > 0) parts.push(`${daysMissing} LIVE-Tag${daysMissing === 1 ? "" : "e"}`);
              if (hoursMissing > 0) parts.push(`${hoursMissing} LIVE-Stunde${hoursMissing === 1 ? "" : "n"}`);
              all.push({
                username: c.tiktok_username,
                primary: `Nur noch ${parts.join(" + ")} bis Eligibility`,
                secondary: `Stufe ${c.ist_tier_level ?? "?"} · TikTok-Forecast greift sofort`,
                weight: 1,
                accent: "warm",
              });
              continue;
            }
            // 2 · Aktivitätsaufstieg jetzt möglich
            if (c.days_to_next_activity_level === 0 && (c.ist_activity_level ?? 0) < 5) {
              all.push({
                username: c.tiktok_username,
                primary: `Aktivitätsaufstieg jetzt möglich`,
                secondary: `Level ${c.ist_activity_level ?? "?"} → ${(c.ist_activity_level ?? 0) + 1}`,
                weight: 2,
                accent: "warm",
              });
              continue;
            }
            // 3 · Tier-Aufstieg ≤50k
            const dm = c.max_diamonds_to_next_tier;
            if (dm !== null && dm > 0 && dm <= 50_000) {
              all.push({
                username: c.tiktok_username,
                primary: `Tier-Aufstieg in Reichweite`,
                secondary: `${fmtBigIntNum(dm)} Diamanten bis Stufe ${(c.ist_tier_level ?? 0) + 1}`,
                weight: 3,
                accent: "warm",
              });
              continue;
            }
            // 4 · Wachsend über Schnitt
            if (c.trend_class === "wachsend") {
              all.push({
                username: c.tiktok_username,
                primary: `Wächst über persönlichem Schnitt`,
                secondary: `Hochrechnung ${fmtUsdNum(c.real_projected_bonus_usd_eom)} bis Monatsende`,
                weight: 4,
                accent: "neutral",
              });
              continue;
            }
          }
          const topPrios = all.sort((a, b) => a.weight - b.weight).slice(0, 7);

          // Hint-Zeilen für Summary (sichtbar auch bei collapsed)
          const warmCount = all.filter((p) => p.accent === "warm").length;
          const heuteHint = topPrios.length === 0
            ? "aktuell keine offenen Hebel"
            : `${topPrios.length} Prioritäten · ${warmCount} kritisch`;
          const netzHint = `${fmtUsdNum(networkIst)} heute · ${fmtUsdNum(networkReal)} Pace${
            goalPct !== null ? ` · ${goalPct}%` : ""
          }`;

          return (
            <>
              {/* HEUTE WICHTIG · default offen, aber zuklappbar */}
              <AdminSection
                title="Heute wichtig"
                hint={heuteHint}
                badge={topPrios.length > 0 ? topPrios.length : null}
                defaultOpen={true}
              >
                {topPrios.length === 0 ? (
                  <p className="text-cream/55 text-sm py-2">
                    Aktuell keine Hebel-Kandidaten · alle Creator stabil oder ohne unmittelbare Aufstiegs-Chance.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {topPrios.map((p, i) => (
                      <li key={p.username + i}>
                        <Link
                          href={`/portal/admin/umsatz?tab=overview&expand=${encodeURIComponent(p.username.toLowerCase())}`}
                          className={`flex items-center justify-between gap-4 border px-4 py-3 md:px-5 md:py-4 transition-colors hover:bg-champagne/[0.04] active:opacity-80 ${
                            p.accent === "warm"
                              ? "border-champagne/40 bg-champagne/[0.04]"
                              : "border-champagne/20"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-cream text-sm font-medium leading-tight">
                              <span className="text-champagne/80">@{p.username}</span>
                              <span className="text-cream/55"> · </span>
                              {p.primary}
                            </p>
                            <p className="text-cream/45 text-xs mt-1">{p.secondary}</p>
                          </div>
                          <span className="text-champagne/60 text-[10px] uppercase tracking-[0.2em] shrink-0">
                            öffnen →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </AdminSection>

              {/* NETWORK OVERVIEW · default offen, aber zuklappbar */}
              <AdminSection
                title="Netzwerk-Übersicht"
                hint={netzHint}
                defaultOpen={true}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-8 items-center">
                  {/* Linke Spalte · KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                    <div>
                      <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-1.5">Netzwerkstand heute</p>
                      <p className="font-display italic text-2xl md:text-3xl text-champagne leading-none">{fmtUsdNum(networkIst)}</p>
                    </div>
                    <div>
                      <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-1.5">Hochrechnung Monatsende</p>
                      <p className="font-display italic text-2xl md:text-3xl text-cream leading-none">{fmtUsdNum(networkReal)}</p>
                      <p className="text-cream/40 text-[10px] mt-1.5">bei gleichbleibender Pace</p>
                    </div>
                    <div>
                      <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-1.5">Aktive Creator</p>
                      <p className="font-display italic text-2xl md:text-3xl text-cream leading-none">
                        {sotLive.length}
                        <span className="text-cream/40 text-base ml-2">/ {eligibleCount} eligible</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-1.5">Über Schnitt</p>
                      <p className="font-display italic text-xl md:text-2xl text-cream leading-none">{wachsendCount}</p>
                    </div>
                    <div>
                      <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-1.5">Unter Schnitt</p>
                      <p className="font-display italic text-xl md:text-2xl text-cream/65 leading-none">{fallendCount}</p>
                    </div>
                    <div>
                      <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mb-1.5">Detail-Ansicht</p>
                      <Link
                        href="/portal/admin/umsatz"
                        className="text-champagne text-sm hover:text-champagne-300 inline-flex items-baseline"
                      >
                        Umsatz öffnen →
                      </Link>
                    </div>
                  </div>

                  {/* Rechte Spalte · Goal-Ring */}
                  <div className="flex flex-col items-center md:items-end">
                    <GoalRing pct={goalPct} />
                    <p className="text-cream/45 text-[10px] uppercase tracking-[0.22em] mt-3 text-center md:text-right max-w-[160px] leading-relaxed">
                      Hochrechnung vs. 3-Monats-Schnitt
                    </p>
                  </div>
                </div>
              </AdminSection>
            </>
          );
        })()}

        {/* WELCOME — Admin/Manager mit Datum-Eyebrow */}
        <section className="mb-14 md:mb-20">
          <p className="eyebrow mb-5 md:mb-6">
            {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })} · {isAdmin ? t("admin.console_admin") : t("admin.console_manager")}
          </p>
          <h1 className="heading-display text-4xl md:text-6xl leading-[1.05]">
            {isAdmin ? (
              <>{t("admin.system_overview_h1_a")} <span className="text-champagne">{t("admin.system_overview_h1_b")}</span></>
            ) : (
              <>{t("admin.my_roster_h1_a")} <span className="text-champagne">{t("admin.my_roster_h1_b")}</span></>
            )}
          </h1>
          <p className="text-cream/55 text-xs md:text-sm mt-3 italic font-display">{greeting()}.</p>
          <div className="hero-mark" />
        </section>

        {/* STATS · collapsed by default */}
        <AdminSection
          title="Netzwerk-Zahlen"
          hint={`${totalUsers} Users · ${activeCreators} aktive Creator · ${upcomingEvents} Events`}
          badge={isAdmin && (openInvites + openTickets) > 0 ? openInvites + openTickets : null}
          warn={isAdmin && openTickets > 0}
        >
          <div className={`grid grid-cols-2 ${isAdmin ? "md:grid-cols-5" : "md:grid-cols-3"} gap-3 md:gap-4`}>
            <Stat
              label={isAdmin ? t("admin.stat_users_total") : t("admin.stat_my_roster")}
              value={totalUsers}
              href="/portal/admin/users"
            />
            <Stat label={t("admin.stat_active_creators")} value={activeCreators} href="/portal/admin/users" />
            {isAdmin && (
              <Stat label={t("admin.stat_open_invites")} value={openInvites} href="/portal/admin/invites" highlight={openInvites > 0} />
            )}
            <Stat label={t("admin.stat_events_open")} value={upcomingEvents} href="/portal/admin/events" />
            {isAdmin && (
              <Stat label={t("admin.stat_tickets_open")} value={openTickets} href="/portal/admin/users" highlight={openTickets > 0} />
            )}
          </div>
        </AdminSection>

        {/* OPERATIONS-COCKPIT · collapsed by default */}
        {isAdmin && (
          <AdminSection
            title="Operations-Cockpit"
            hint="Pending · Push · Telefon · LIVE-Report · DM-Queue · Inbox-wartet"
            badge={opsTotal > 0 ? opsTotal : null}
            warn={ops.dm_failed > 0}
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              <OpsTile href="/portal/admin/pending" label="Creator pending" count={ops.creators_pending} />
              <OpsTile href="/portal/admin/services/tiktok-push" label="TikTok-Push" count={ops.tiktok_push} />
              <OpsTile href="/portal/admin/services/phone-requests" label="Telefon" count={ops.phone_request} />
              <OpsTile href="/portal/admin/services/live-absences" label="Abmeldung" count={ops.live_absence} />
              <OpsTile href="/portal/admin/services/content-helper" label="Content-Helfer" count={ops.content_helper} />
              <OpsTile href="/portal/admin/services/big-match" label="Big Match" count={ops.big_match} />
              <OpsTile href="/portal/admin/analyse/account" label="Account-Analyse" count={ops.account_analyse} />
              <OpsTile href="/portal/admin/analyse/live" label="LIVE-Report" count={ops.live_report} />
              <OpsTile href="/portal/admin/showcase" label="Showcase pending" count={ops.showcase_pending} />
              <OpsTile href="/portal/admin/notifications-queue" label="DM-Queue" count={ops.dm_queue} />
              <OpsTile href="/portal/admin/notifications-queue" label="DM-Fail" count={ops.dm_failed} warn={ops.dm_failed > 0} />
              <OpsTile href="/portal/admin/messages?f=waiting" label="Inbox wartet" count={inboxWaiting} />
            </div>
          </AdminSection>
        )}

        {/* WEBSITE + PORTAL-AKTIVITAET · collapsed by default */}
        {isAdmin && (
          <AdminSection
            title="Website & Portal-Aktivität"
            hint="Public-Site-Traffic · Portal-Sessions · Events letzte 24h"
          >
            <WebsiteAnalyticsBlock isAdmin={isAdmin} />
            <PortalActivityBlock isAdmin={isAdmin} />
          </AdminSection>
        )}

        {/* CREATOR-ANFRAGEN · collapsed by default */}
        {isAdmin && (
          <AdminSection
            title="Creator-Anfragen"
            hint={t("admin.creator_requests_subtitle")}
          >
            <Link
              href="/portal/admin/applications"
              className="block border border-champagne/15 hover:border-champagne/40 px-5 py-4 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em] mb-1">{t("admin.creator_requests")}</p>
                  <p className="text-cream font-display italic text-xl">
                    {t("admin.creator_requests_subtitle")}
                  </p>
                </div>
                <span className="text-champagne text-[11px] uppercase tracking-[0.2em] hover:text-champagne-300">
                  {t("admin.open_link")}
                </span>
              </div>
            </Link>
          </AdminSection>
        )}

        {/* CRON-HEALTH — collapsed by default, glow wenn warn/fail */}
        {isAdmin && cronHealth.length > 0 && (() => {
          const failOrWarn = cronHealth.filter((h) => h.state === "fail" || h.state === "warn").length;
          return (
            <AdminSection
              title="Synchronisierungs-Status"
              hint="Letzter Lauf der Hintergrund-Worker · 48h"
              badge={failOrWarn > 0 ? failOrWarn : null}
              warn={failOrWarn > 0}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {cronHealth.map((h) => (
                  <CronTile key={h.label} {...h} />
                ))}
              </div>
            </AdminSection>
          );
        })()}

        {/* NEWS & INFOS · collapsed by default */}
        <AdminSection
          title="News & Hinweise"
          hint="Birthdays · neue Creator · System-Hinweise"
        >
          <NewsFeed supabase={supabase} />
        </AdminSection>

        {/* KPI-Block — diese Woche · collapsed by default */}
        {isAdmin && (
          <AdminSection
            title="Diese Woche"
            hint="Reviews · Push · Matches · Kosten · seit Montag"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              <KpiTile label="Reviews fertig" value={kpi.reviews_done.toString()} />
              <KpiTile label="Push bestaetigt" value={kpi.push_selected.toString()} />
              <KpiTile label="Matches geplant" value={kpi.matches_planned.toString()} />
              <KpiTile
                label="AI-Cost USD"
                value={kpi.cost_usd > 0 ? `$${kpi.cost_usd.toFixed(2)}` : "$0"}
              />
              <KpiTile
                label="Avg Review"
                value={kpi.avg_review_minutes > 0
                  ? kpi.avg_review_minutes < 60
                    ? `${kpi.avg_review_minutes} min`
                    : `${(kpi.avg_review_minutes / 60).toFixed(1)} h`
                  : "—"}
              />
            </div>
          </AdminSection>
        )}

        {/* QUICK ACTIONS · collapsed by default */}
        <AdminSection
          title={t("admin.quick_actions")}
          hint="Routing zu Admin-Detail-Seiten"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <AdminTile href="/portal/admin/users" title={isAdmin ? "Users" : "Roster"} hint={isAdmin ? "Rollen · Status · Sperren" : "Eigene Creator"} />
            {isAdmin && (
              <>
                <AdminTile href="/portal/admin/invites" title="Invites" hint="Codes generieren" />
                <AdminTile href="/portal/admin/showcase" title="Showcase" hint="Creator-Cards · Approve" />
                <AdminTile href="/portal/admin/pending" title="Creator Aufnahme" hint="Pending freigeben" />
                <AdminTile href="/portal/admin/services/big-match" title="Big Match" hint="Match-Anfragen · Queue" />
                <AdminTile href="/portal/admin/notifications-queue" title="TikTok-DM Queue" hint="External-Push · Status · Retry" />
                <AdminTile href="/portal/admin/analyse/account" title="Account Analyse" hint="Profil-Reviews · Queue" />
                <AdminTile href="/portal/admin/analyse/live" title="LIVE Performance" hint="KPI-Reports · Queue" />
                <AdminTile href="/portal/admin/analyse/health" title="Analyse Health" hint="Datenquellen · Errors · Cost" />
                <AdminTile href="/portal/admin/challenges" title="Academy Challenges" hint="Anlegen · Aktivieren · Gewinner" />
                <AdminTile href="/portal/admin/messages" title="Broadcasts" hint="Direct + Broadcast" />
                <AdminTile href="/portal/admin/inbox/groups" title="Gruppen" hint="Channels · Events · Community" />
                <AdminTile href="/portal/admin/downloads" title="Downloads" hint="Asset-Library" />
                <AdminTile href="/portal/admin/diagnostics" title="Diagnostics" hint="DB-State · Runtime-Check" />
                <AdminTile href="/portal/admin/audit-logs" title="Audit-Logs" hint="Trail aller Admin-Mutations" />
                <AdminTile href="/portal/admin/umsatz" title="Umsatz" hint="Current · Forecast · Missing · Admin-only" />
                <AdminTile href="/portal/admin/ranking" title="LIVE-Analyse" hint="7 Tabs · 52 Creator · Admin-only" />
              </>
            )}
            <AdminTile href="/portal/admin/events" title="Events" hint="CRUD + Anmeldungen" />
          </div>
        </AdminSection>

        {/* ACTIVITY FEEDS · collapsed by default */}
        <AdminSection
          title="Neue Creator & Einladungen"
          hint={isAdmin ? "Signups · Invites · letzte 7 Tage" : "Signups · letzte 7 Tage"}
          badge={recentSignups.length + (isAdmin ? recentInvites.length : 0) || null}
        >
        <div className={`grid ${isAdmin ? "md:grid-cols-2" : "md:grid-cols-1"} gap-6`}>
          {/* Recent Signups */}
          <div className="border border-champagne/15 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow">{t("admin.recent_creators")}</p>
              <Link href="/portal/admin/users" className="text-champagne text-[10px] uppercase tracking-[0.2em] hover:text-champagne-300">{t("common.all_link")}</Link>
            </div>
            {recentSignups.length === 0 ? (
              <p className="editorial-empty">{t("admin.empty_roster")}</p>
            ) : (
              <ul className="space-y-3">
                {recentSignups.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-champagne/20 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne text-xs font-display italic shrink-0">
                        {(p.display_name || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-cream text-sm truncate">{p.display_name}</p>
                      <p className="text-cream/40 text-[10px] truncate">@{p.tiktok_username} · {p.role}</p>
                    </div>
                    <span className="text-cream/30 text-[10px] uppercase tracking-[0.15em] shrink-0">
                      {new Date(p.joined_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Invites — Admin-only */}
          {isAdmin && (
          <div className="border border-champagne/15 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow">{t("admin.recent_invites")}</p>
              <Link href="/portal/admin/invites" className="text-champagne text-[10px] uppercase tracking-[0.2em] hover:text-champagne-300">{t("common.all_link")}</Link>
            </div>
            {recentInvites.length === 0 ? (
              <p className="editorial-empty">{t("admin.empty_invites")}</p>
            ) : (
              <ul className="space-y-3">
                {recentInvites.map((i) => {
                  const used = !!i.used_at;
                  const expired = i.expires_at && new Date(i.expires_at) < now;
                  const status = used ? "used" : expired ? "expired" : "open";
                  const statusColor = used ? "text-cream/40" : expired ? "text-red-400/70" : "text-champagne";
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`font-mono text-xs truncate ${used ? "text-cream/40 line-through" : "text-cream"}`}>{i.code}</p>
                        <p className="text-cream/40 text-[10px]">{i.intended_role}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-[0.2em] shrink-0 ${statusColor}`}>{status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          )}
        </div>
        </AdminSection>

        {/* Recent Tickets (full-width) — Admin-only · collapsed by default */}
        {isAdmin && (
        <AdminSection
          title="Support-Anfragen"
          hint="Letzte Tickets · offen · in Bearbeitung · erledigt"
          badge={openTickets > 0 ? openTickets : null}
          warn={openTickets > 0}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="eyebrow">{t("admin.recent_tickets")}</p>
            <Link href="/portal/support" className="text-champagne text-[10px] uppercase tracking-[0.2em] hover:text-champagne-300">{t("common.all_link")}</Link>
          </div>
          {recentTickets.length === 0 ? (
            <p className="editorial-empty">{t("admin.empty_tickets")}</p>
          ) : (
            <ul className="space-y-2">
              {recentTickets.map((tk) => (
                <li key={tk.id} className="flex items-center gap-3 py-2 border-b border-champagne/5 last:border-b-0">
                  <span className={`text-[10px] uppercase tracking-[0.2em] shrink-0 px-2 py-0.5 border ${
                    tk.status === "open" ? "border-champagne text-champagne" :
                    tk.status === "in_progress" ? "border-cream/40 text-cream/60" :
                    "border-cream/20 text-cream/40"
                  }`}>{tk.status}</span>
                  <p className="text-cream text-sm truncate flex-1">{tk.subject}</p>
                  <span className="text-cream/30 text-[10px] uppercase tracking-[0.15em] shrink-0">
                    {new Date(tk.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminSection>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`group card-lift border p-5 md:p-6 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15 hover:border-champagne hover:bg-champagne/5"}`}
    >
      <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-4 leading-tight">{label}</p>
      <p className={`font-display italic font-black text-4xl md:text-5xl ${highlight ? "text-champagne" : "text-cream group-hover:text-champagne"} transition-colors`}>{value}</p>
    </Link>
  );
}

function OpsTile({ href, label, count, warn }: { href: string; label: string; count: number; warn?: boolean }) {
  const highlight = count > 0;
  const isWarn = warn && count > 0;
  return (
    <Link
      href={href}
      className={`group border p-3 md:p-4 transition-colors ${
        isWarn
          ? "border-red-400/40 bg-red-400/5"
          : highlight
          ? "border-champagne bg-champagne/5"
          : "border-champagne/10 hover:border-champagne/30"
      }`}
    >
      <p className={`text-[9px] uppercase tracking-[0.22em] mb-2 ${highlight ? "text-champagne" : "text-cream/45"}`}>
        {label}
      </p>
      <p className={`font-display italic font-black text-2xl md:text-3xl leading-none ${
        isWarn ? "text-red-300/85" : highlight ? "text-champagne" : "text-cream/55"
      }`}>
        {count}
      </p>
    </Link>
  );
}

function CronTile({
  label, state, lastRun, detail,
}: {
  label: string;
  state: "ok" | "warn" | "fail" | "missing";
  lastRun: string | null;
  detail: string | null;
}) {
  const tone =
    state === "fail" ? "border-red-400/40 bg-red-400/[0.04]"
    : state === "warn" ? "border-yellow-400/40 bg-yellow-400/[0.04]"
    : state === "missing" ? "border-cream/15 bg-cream/[0.02]"
    : "border-champagne/20";
  const stateLabel =
    state === "ok" ? "OK"
    : state === "warn" ? "WARN"
    : state === "fail" ? "FAIL"
    : "—";
  const stateColor =
    state === "ok" ? "text-champagne"
    : state === "warn" ? "text-yellow-300/85"
    : state === "fail" ? "text-red-300/85"
    : "text-cream/40";
  return (
    <div className={`border p-3 md:p-4 ${tone}`}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-cream/55 text-[10px] uppercase tracking-[0.22em] truncate">
          {label}
        </p>
        <span className={`text-[10px] uppercase tracking-[0.25em] shrink-0 ${stateColor}`}>
          {stateLabel}
        </span>
      </div>
      <p className="font-display italic text-cream text-lg md:text-xl leading-tight">
        {lastRun ?? "Kein Lauf"}
      </p>
      {detail && (
        <p className={`text-[10px] uppercase tracking-[0.2em] mt-2 line-clamp-1 ${
          state === "fail" ? "text-red-300/65" : "text-cream/35"
        }`} title={detail}>
          {detail}
        </p>
      )}
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-champagne/15 p-3 md:p-4">
      <p className="text-cream/45 text-[9px] uppercase tracking-[0.22em] mb-2">{label}</p>
      <p className="font-display italic text-cream text-2xl md:text-3xl leading-none">{value}</p>
    </div>
  );
}

function AdminTile({ href, title, hint }: { href: string; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group card-lift border border-champagne/15 p-6 md:p-7 hover:border-champagne hover:bg-champagne/5"
    >
      <h3 className="font-display italic font-black text-xl md:text-2xl text-cream mb-2 group-hover:text-champagne transition-colors">
        {title}
      </h3>
      <p className="text-cream/45 text-xs leading-relaxed tracking-wide">{hint}</p>
    </Link>
  );
}

// V2-A · Goal-Ring · pure SVG, Server-Component-fähig.
// Visualisiert pct (0-120) als Champagne-Kreis. Bei null: leerer Ring.
function GoalRing({ pct }: { pct: number | null }) {
  const size = 124;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePct = pct === null ? 0 : Math.max(0, Math.min(120, pct));
  const dashOffset = circumference * (1 - Math.min(100, safePct) / 100);
  // Bei >100% blendet ein zweiter Ring "über" den ersten ein (subtil)
  const overflow = safePct > 100 ? safePct - 100 : 0;
  const overflowOffset = circumference * (1 - overflow / 100);
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Hintergrund-Kreis */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(212,175,107,0.12)"
          strokeWidth={stroke}
        />
        {/* Progress-Ring */}
        {pct !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(212,175,107,0.85)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        )}
        {/* Overflow-Ring (>100%) */}
        {overflow > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(245,231,206,0.75)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={overflowOffset}
          />
        )}
      </svg>
      {/* Center-Label */}
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        {pct === null ? (
          <p className="text-cream/40 text-sm">—</p>
        ) : (
          <>
            <p className="font-display italic text-cream text-2xl md:text-3xl leading-none">{Math.round(pct)}<span className="text-cream/50 text-lg">%</span></p>
            <p className="text-cream/40 text-[9px] uppercase tracking-[0.2em] mt-1">vs. Schnitt</p>
          </>
        )}
      </div>
    </div>
  );
}

// Block C · Accordion-Wrapper für nicht-kritische Bereiche.
// Native <details>/<summary> — kein JS, kein Client-State, kein Hydration-Cost.
// Default collapsed. Wenn `badge` > 0: subtiler Champagne-Glow auf der Border.
function AdminSection({
  title, hint, badge, warn = false, defaultOpen = false, children,
}: {
  title: string;
  hint?: string;
  badge?: number | null;
  warn?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const hasSignal = (badge ?? 0) > 0;
  const borderCls = warn && hasSignal
    ? "border-red-400/40 bg-red-400/[0.03]"
    : hasSignal
    ? "border-champagne/35 bg-champagne/[0.03]"
    : "border-champagne/15";
  return (
    <details
      open={defaultOpen}
      className={`group mb-4 border ${borderCls}`}
    >
      <summary className="list-none cursor-pointer px-5 py-4 flex items-baseline justify-between gap-4 hover:bg-champagne/[0.02]">
        <div className="flex items-baseline gap-3 min-w-0 flex-1">
          <span className="inline-block text-champagne/55 group-open:text-champagne transition-transform group-open:rotate-90 text-[11px] leading-none mt-1">
            ▸
          </span>
          <div className="min-w-0">
            <p className="text-cream/85 text-sm font-medium">{title}</p>
            {hint && (
              <p className="text-cream/40 text-[10px] uppercase tracking-[0.18em] mt-0.5">{hint}</p>
            )}
          </div>
        </div>
        {hasSignal && (
          <span className={`inline-flex items-center text-[10px] uppercase tracking-[0.2em] px-2 py-1 ${
            warn
              ? "border border-red-400/50 bg-red-400/[0.06] text-red-300/90"
              : "border border-champagne/45 bg-champagne/[0.06] text-champagne"
          }`}>
            {badge}
          </span>
        )}
      </summary>
      <div className="px-5 pb-5 pt-1 border-t border-champagne/10">
        {children}
      </div>
    </details>
  );
}
