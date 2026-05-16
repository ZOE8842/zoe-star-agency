import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

// /portal/admin/ranking — Admin-LIVE-Analyse (V7 · 2026-05-16)
//
// SCOPE: NUR Admin (requireAdmin). Manager und Creator sehen diese Seite nicht.
// QUELLE: creator_monthly_metrics (handle-keyed seit Migration 0046)
// JOIN:   profiles via tiktok_handle_normalized (Class A vs Class B)
//
// 7 Tabs, jeder sortiert nach genau EINER echten Kennzahl:
//   1. 💎 Diamanten          → diamonds_month DESC
//   2. ⏱ LIVE-Stunden        → live_minutes_total DESC
//   3. 🔥 LIVE-Tage          → valid_live_days DESC
//   4. 👀 Zuschauer          → (avg_viewers * valid_live_days) approx total DESC
//   5. 📈 Neue Follower      → followers_gained DESC
//   6. 🎁 Geschenkquote      → gift_rate DESC
//   7. ⏳ Wiedergabezeit     → watchtime_avg_seconds DESC
//
// KEINE geheimen Scores. Jede Tab-Sortierung = 1 ehrliche Kennzahl.
// average_viewers wird als "Ø Zuschauer/Tag" gelabelt (Backstage-Quelle ist
// Tagesmittel, nicht Concurrent-Average — User-Klarstellung 2026-05-16).
// "Zuschauer" als TOTAL wird approximiert mit avg * valid_days.

interface Row {
  metric_id: string;
  tiktok_username: string;
  tiktok_handle_normalized: string;
  // Profile-Side (Class B: alles NULL)
  profile_id: string | null;
  display_name: string | null;
  portal_status: string | null;
  onboarding_completed: boolean | null;
  // KPIs
  valid_live_days: number;
  live_minutes_total: number;
  live_hours_display: number | null;
  average_viewers: number;             // = Ø Zuschauer/Tag aus Backstage
  last_live_date: string | null;
  activity_status: "aktiv" | "unregelmaessig" | "inaktiv" | null;
  diamonds_month: number | null;
  gift_rate: number | null;
  impressions: number | null;
  live_views: number | null;
  followers_gained: number | null;
  ctr: number | null;
  watchtime_avg_seconds: number | null;
  streams_count: number | null;
  gifts_count: number | null;
  gifters_count: number | null;
  // Derived
  approx_total_viewers: number;        // = average_viewers * valid_live_days
}

type TabKey =
  | "diamanten"
  | "live-stunden"
  | "live-tage"
  | "zuschauer"
  | "neue-follower"
  | "schenkende"
  | "wiedergabezeit"
  | "portalstatus"
  | "daily";

interface TabDef {
  key: TabKey;
  emoji: string;
  label: string;
  beschreibung: string;
  legende: Array<{ term: string; def: string }>;
  sortKey: (r: Row) => number;
  // Optional Custom-Sort fuer Portalstatus-Tab (Gruppierung statt einfache Zahl)
  customSort?: (a: Row, b: Row) => number;
  columns: Array<{
    key: string;
    label: string;
    align?: "left" | "right" | "center";
    render: (r: Row) => string;
  }>;
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

function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("de-DE");
}
function fmtFloat(n: number | null | undefined, suffix = ""): string {
  if (n === null || n === undefined) return "—";
  return `${Number(n).toFixed(2).replace(".", ",")}${suffix}`;
}
function fmtHours(min: number, display: number | null): string {
  if (display != null) return `${display.toString().replace(".", ",")}h`;
  if (min <= 0) return "0h";
  return `${(min / 60).toFixed(1).replace(".", ",")}h`;
}
function fmtSeconds(sec: number | null): string {
  if (sec === null || sec === undefined) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}
function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function portalBadge(profileId: string | null, status: string | null):
  { label: string; cls: string } {
  if (!profileId) return { label: "Nur Backstage", cls: "border border-cream/15 text-cream/55" };
  if (status === "active") return { label: "Portal aktiv", cls: "border border-champagne/30 text-champagne/80" };
  if (status === "inactive") return { label: "Portal inaktiv", cls: "border border-cream/20 text-cream/45" };
  if (status === "pending") return { label: "Portal pending", cls: "border border-yellow-400/40 text-yellow-300/85" };
  return { label: status ?? "—", cls: "border border-cream/15 text-cream/35" };
}

function activityBadge(s: Row["activity_status"]): { label: string; cls: string } {
  if (s === "aktiv") return { label: "aktiv", cls: "bg-champagne/15 text-champagne border border-champagne/40" };
  if (s === "unregelmaessig") return { label: "unregelmäßig", cls: "border border-champagne/30 text-champagne/80" };
  if (s === "inaktiv") return { label: "inaktiv", cls: "border border-cream/20 text-cream/45" };
  return { label: "—", cls: "border border-cream/15 text-cream/35" };
}

const TABS: TabDef[] = [
  // ---------- 1. DIAMANTEN ----------
  {
    key: "diamanten",
    emoji: "💎",
    label: "Diamanten",
    beschreibung: "Sortiert nach gesamten Diamanten im aktuellen Monat.",
    legende: [
      { term: "Diamanten", def: "Gesamt-Diamanten aus LIVEs im aktuellen Monat" },
      { term: "LIVE-Tage", def: "Gueltige LIVE-Tage (Backstage-Definition)" },
      { term: "Ø Zuschauer/Tag", def: "Tagesmittel der Zuschauer-Zahl an LIVE-Tagen" },
    ],
    sortKey: (r) => r.diamonds_month ?? 0,
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username, align: "left" },
      { key: "diamanten", label: "💎 Diamanten", align: "right", render: (r) => fmtInt(r.diamonds_month) },
      { key: "tage", label: "LIVE-Tage", align: "right", render: (r) => String(r.valid_live_days) },
      { key: "zeit", label: "LIVE-Zeit", align: "right", render: (r) => fmtHours(r.live_minutes_total, r.live_hours_display) },
      { key: "zuschauer_tag", label: "Ø Zuschauer/Tag", align: "right", render: (r) => fmtInt(r.average_viewers) },
    ],
  },

  // ---------- 2. LIVE-STUNDEN ----------
  {
    key: "live-stunden",
    emoji: "⏱",
    label: "LIVE-Stunden",
    beschreibung: "Sortiert nach gesamter LIVE-Zeit im aktuellen Monat.",
    legende: [
      { term: "LIVE-Zeit", def: "Summe aller gestreamten Minuten im Monat" },
      { term: "Streams", def: "Anzahl einzelner LIVE-Sessions (wenn Backstage liefert)" },
      { term: "Letzter LIVE", def: "Datum des letzten LIVE-Streams" },
    ],
    sortKey: (r) => r.live_minutes_total,
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username },
      { key: "zeit", label: "⏱ LIVE-Zeit", align: "right", render: (r) => fmtHours(r.live_minutes_total, r.live_hours_display) },
      { key: "tage", label: "LIVE-Tage", align: "right", render: (r) => String(r.valid_live_days) },
      { key: "streams", label: "Streams", align: "right", render: (r) => fmtInt(r.streams_count) },
      { key: "last", label: "Letzter LIVE", align: "right", render: (r) => fmtDate(r.last_live_date) },
    ],
  },

  // ---------- 3. LIVE-TAGE ----------
  {
    key: "live-tage",
    emoji: "🔥",
    label: "LIVE-Tage",
    beschreibung: "Sortiert nach gueltigen LIVE-Tagen im aktuellen Monat.",
    legende: [
      { term: "LIVE-Tage", def: "Anzahl Tage mit gueltigem LIVE (Backstage zaehlt nach Schwellen)" },
      { term: "Aktivitaet", def: "Backstage-Klassifikation: aktiv / unregelmaessig / inaktiv" },
    ],
    sortKey: (r) => r.valid_live_days,
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username },
      { key: "tage", label: "🔥 LIVE-Tage", align: "right", render: (r) => String(r.valid_live_days) },
      { key: "zeit", label: "LIVE-Zeit", align: "right", render: (r) => fmtHours(r.live_minutes_total, r.live_hours_display) },
      { key: "activity", label: "Aktivitaet", align: "center", render: () => "" },
      { key: "last", label: "Letzter LIVE", align: "right", render: (r) => fmtDate(r.last_live_date) },
    ],
  },

  // ---------- 4. ZUSCHAUER ----------
  {
    key: "zuschauer",
    emoji: "👀",
    label: "Zuschauer",
    beschreibung: "Sortiert nach approximierten Gesamt-Zuschauern im aktuellen Monat (Ø Zuschauer/Tag × LIVE-Tage).",
    legende: [
      { term: "Zuschauer (gesch.)", def: "Geschaetzt: Ø Zuschauer/Tag × LIVE-Tage" },
      { term: "Aufrufe", def: "Gesamte LIVE-Aufrufe im Monat (Backstage: live_views)" },
      { term: "Reichweite", def: "Wie oft TikTok das LIVE ausgespielt hat (Impressionen)" },
      { term: "Klickrate", def: "Anteil der Ausspielung, die zu Klick fuehrten (CTR)" },
    ],
    sortKey: (r) => r.approx_total_viewers,
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username },
      { key: "viewers_total", label: "👀 Zuschauer (gesch.)", align: "right", render: (r) => fmtInt(r.approx_total_viewers) },
      { key: "live_views", label: "Aufrufe", align: "right", render: (r) => fmtInt(r.live_views) },
      { key: "impr", label: "Reichweite", align: "right", render: (r) => fmtInt(r.impressions) },
      { key: "ctr", label: "Klickrate", align: "right", render: (r) => fmtFloat(r.ctr, " %") },
    ],
  },

  // ---------- 5. NEUE FOLLOWER ----------
  {
    key: "neue-follower",
    emoji: "📈",
    label: "Neue Follower",
    beschreibung: "Sortiert nach neu gewonnenen Followern im aktuellen Monat.",
    legende: [
      { term: "Neue Follower", def: "Folgezunahme im Monat (Backstage: followers_gained)" },
      { term: "Ø Zuschauer/Tag", def: "Tagesmittel der Zuschauer-Zahl an LIVE-Tagen" },
      { term: "Reichweite", def: "Impressionen (wie oft TikTok ausspielte)" },
      { term: "Klickrate", def: "Wie viele Klicks pro Ausspielung (CTR)" },
    ],
    sortKey: (r) => r.followers_gained ?? 0,
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username },
      { key: "fol", label: "📈 Neue Follower", align: "right", render: (r) => fmtInt(r.followers_gained) },
      { key: "zuschauer_tag", label: "Ø Zuschauer/Tag", align: "right", render: (r) => fmtInt(r.average_viewers) },
      { key: "impr", label: "Reichweite", align: "right", render: (r) => fmtInt(r.impressions) },
      { key: "ctr", label: "Klickrate", align: "right", render: (r) => fmtFloat(r.ctr, " %") },
    ],
  },

  // ---------- 6. SCHENKENDE (vorher Geschenkquote — V8: faireres Ranking) ----------
  // User-Korrektur 2026-05-16:
  //   Geschenkquote ist als Ranking unfair, weil ein Creator mit wenig
  //   LIVE-Zeit / wenigen Zuschauern leicht eine hohe Quote bekommt.
  //   Schenkende = Anzahl unique Spender → echte Community-Breite.
  {
    key: "schenkende",
    emoji: "👤",
    label: "Schenkende",
    beschreibung: "Sortiert nach der Anzahl der Personen, die im aktuellen Monat Geschenke gesendet haben.",
    legende: [
      { term: "Schenkende", def: "Personen, die Geschenke gesendet haben (unique gifters)" },
      { term: "Geschenke", def: "Gesamte Anzahl der erhaltenen Geschenke" },
      { term: "Ø Zuschauer/Tag", def: "Tagesmittel der Zuschauer-Zahl" },
      { term: "Diamanten", def: "Gesamte verdiente Diamanten im Monat" },
    ],
    sortKey: (r) => r.gifters_count ?? 0,
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username },
      { key: "gifters", label: "👤 Schenkende", align: "right", render: (r) => fmtInt(r.gifters_count) },
      { key: "gifts", label: "Geschenke", align: "right", render: (r) => fmtInt(r.gifts_count) },
      { key: "zuschauer_tag", label: "Ø Zuschauer/Tag", align: "right", render: (r) => fmtInt(r.average_viewers) },
      { key: "diamanten", label: "💎 Diamanten", align: "right", render: (r) => fmtInt(r.diamonds_month) },
      { key: "gifts", label: "Gifts", align: "right", render: (r) => fmtInt(r.gifts_count) },
      { key: "gifters", label: "Schenkende", align: "right", render: (r) => fmtInt(r.gifters_count) },
      { key: "zuschauer_tag", label: "Ø Zuschauer/Tag", align: "right", render: (r) => fmtInt(r.average_viewers) },
    ],
  },

  // ---------- 7. WIEDERGABEZEIT ----------
  {
    key: "wiedergabezeit",
    emoji: "⏳",
    label: "Wiedergabezeit",
    beschreibung: "Sortiert nach durchschnittlicher Wiedergabezeit pro Zuschauer.",
    legende: [
      { term: "Wiedergabezeit/Z.", def: "Wie lange Zuschauer im Durchschnitt im LIVE bleiben (Sekunden)" },
      { term: "Ø Zuschauer/Tag", def: "Tagesmittel der Zuschauer-Zahl" },
      { term: "LIVE-Zeit", def: "Gestreamte Gesamtzeit im Monat" },
    ],
    sortKey: (r) => r.watchtime_avg_seconds ?? 0,
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username },
      { key: "wt", label: "⏳ Wiedergabezeit/Z.", align: "right", render: (r) => fmtSeconds(r.watchtime_avg_seconds) },
      { key: "zuschauer_tag", label: "Ø Zuschauer/Tag", align: "right", render: (r) => fmtInt(r.average_viewers) },
      { key: "zeit", label: "LIVE-Zeit", align: "right", render: (r) => fmtHours(r.live_minutes_total, r.live_hours_display) },
      { key: "last", label: "Letzter LIVE", align: "right", render: (r) => fmtDate(r.last_live_date) },
    ],
  },

  // ---------- 8. PORTALSTATUS (V8 · eigener Kontroll-Tab) ----------
  // Gruppiert nach Portal-Zugehoerigkeit, kein Leistungs-Ranking sondern
  // Onboarding-/Pflege-Sicht: wer ist im Portal, wer fehlt, wer onboarded.
  // Reihenfolge: 1) nur Backstage  2) pending  3) inaktiv  4) aktiv
  //   damit Handlungsbedarfs-Cases zuerst sichtbar sind.
  {
    key: "portalstatus",
    emoji: "🧾",
    label: "Portalstatus",
    beschreibung: "Zeigt, welche Backstage-Creator bereits im Portal sind und welche noch fehlen. Reihenfolge: Handlungsbedarf zuerst.",
    legende: [
      { term: "Status", def: "Nur Backstage / Portal pending / Portal inaktiv / Portal aktiv" },
      { term: "Onboarding", def: "onboarded (Setup fertig) · pending (Setup offen) · — (kein Profil)" },
      { term: "Handle", def: "Normalisierter TikTok-Handle (lowercase, ohne @)" },
      { term: "Diamanten", def: "Mai-Gesamtdiamanten zur Einschaetzung der Onboarding-Prioritaet" },
    ],
    sortKey: () => 0, // wird vom customSort ueberschrieben
    customSort: (a, b) => {
      // Status-Rank: niedriger = weiter oben
      const rank = (r: Row): number => {
        if (r.profile_id === null) return 0;          // Nur Backstage zuerst
        if (r.portal_status === "pending") return 1;  // Pending
        if (r.portal_status === "inactive") return 2; // Inaktiv
        return 3;                                     // Aktiv
      };
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      // Innerhalb gleicher Gruppe: Diamanten DESC (Prioritaet)
      return (b.diamonds_month ?? 0) - (a.diamonds_month ?? 0);
    },
    columns: [
      { key: "creator", label: "Creator", render: (r) => r.display_name || r.tiktok_username },
      { key: "handle", label: "Handle", render: (r) => `@${r.tiktok_username}` },
      { key: "status_badge", label: "Status", align: "center", render: () => "" },
      { key: "onboarding", label: "Onboarding", align: "center", render: () => "" },
      { key: "diamanten", label: "💎 Diamanten", align: "right", render: (r) => fmtInt(r.diamonds_month) },
      { key: "last", label: "Letzter LIVE", align: "right", render: (r) => fmtDate(r.last_live_date) },
    ],
  },

  // ---------- 9. DAILY RANKING (V8.1) ----------
  // Screenshot-freundliche Top-3-Uebersicht aus 7 Performance-Kategorien.
  // Spezial-Render (Card-Grid, kein Tabellen-Layout) — siehe AdminLiveAnalysePage.
  // Sortier-/Spalten-Felder sind bewusst leer; der Render-Pfad nutzt seine
  // eigene Logik, die aus rows[] die Top-3 pro Kategorie zieht.
  {
    key: "daily",
    emoji: "🗞️",
    label: "Daily Ranking",
    beschreibung: "Top 3 je Kategorie — kompakt, screenshot-freundlich fuer Posts/Gruppen.",
    legende: [
      { term: "Diamanten", def: "Nur Reihenfolge (keine internen Umsatzwerte sichtbar)" },
      { term: "Stand", def: "Letzter Backstage-Sync (siehe Header)" },
      { term: "Portalstatus", def: "wird in Daily Ranking bewusst NICHT angezeigt" },
    ],
    sortKey: () => 0,
    columns: [],
  },
];

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminLiveAnalysePage({ searchParams }: PageProps) {
  // SCOPE-LOCK: Manager wird zu /portal geredirected (V7-Admin-Only)
  const { profile } = await requireAdmin();
  const sp = await searchParams;
  const activeTab: TabKey =
    (TABS.find((t) => t.key === sp.tab)?.key) ?? "diamanten";
  const tab = TABS.find((t) => t.key === activeTab)!;

  const db = sr();
  const month = currentMonthIso();

  // Alle Mai-Metrics holen (handle-keyed)
  const { data: metrics } = await db
    .from("creator_monthly_metrics")
    .select(
      "id, profile_id, tiktok_username, tiktok_handle_normalized, valid_live_days, live_minutes_total, live_hours_display, average_viewers, last_live_date, activity_status, diamonds_month, gift_rate, impressions, live_views, followers_gained, ctr, watchtime_avg_seconds, streams_count, gifts_count, gifters_count, synced_at",
    )
    .eq("month", month);

  // Letzter Sync fuer Stand-Anzeige (Daily Ranking + Footer)
  const lastSyncIso = (metrics ?? [])
    .map((m) => (m as { synced_at?: string }).synced_at)
    .filter((s): s is string => !!s)
    .sort()
    .pop() ?? null;

  // Profile-Lookup ueber Handle (Class A vs Class B)
  const handles = (metrics ?? [])
    .map((m) => m.tiktok_handle_normalized as string | null)
    .filter((h): h is string => !!h);

  const { data: profiles } = handles.length > 0
    ? await db
        .from("profiles")
        .select("id, tiktok_handle_normalized, display_name, status, onboarding_completed")
        .in("tiktok_handle_normalized", handles)
    : { data: [] as Array<{
        id: string; tiktok_handle_normalized: string;
        display_name: string | null; status: string;
        onboarding_completed: boolean;
      }> };
  const profileByHandle = new Map(
    (profiles ?? []).map((p) => [p.tiktok_handle_normalized, p]),
  );

  const rows: Row[] = (metrics ?? []).map((m) => {
    const p = profileByHandle.get(m.tiktok_handle_normalized);
    const days = m.valid_live_days || 0;
    const avg = m.average_viewers || 0;
    return {
      metric_id: m.id,
      tiktok_username: m.tiktok_username ?? "",
      tiktok_handle_normalized: m.tiktok_handle_normalized ?? "",
      profile_id: p?.id ?? null,
      display_name: p?.display_name ?? null,
      portal_status: p?.status ?? null,
      onboarding_completed: p?.onboarding_completed ?? null,
      valid_live_days: days,
      live_minutes_total: m.live_minutes_total,
      live_hours_display: m.live_hours_display,
      average_viewers: avg,
      last_live_date: m.last_live_date,
      activity_status: m.activity_status,
      diamonds_month: m.diamonds_month,
      gift_rate: m.gift_rate,
      impressions: m.impressions ?? null,
      live_views: m.live_views ?? null,
      followers_gained: m.followers_gained ?? null,
      ctr: m.ctr ?? null,
      watchtime_avg_seconds: m.watchtime_avg_seconds ?? null,
      streams_count: m.streams_count ?? null,
      gifts_count: m.gifts_count ?? null,
      gifters_count: m.gifters_count ?? null,
      approx_total_viewers: avg * days,
    };
  });

  // Sortierung: customSort (z.B. Portalstatus-Gruppierung) oder Tab-Sort-Key DESC
  if (tab.customSort) {
    rows.sort(tab.customSort);
  } else {
    rows.sort((a, b) => tab.sortKey(b) - tab.sortKey(a));
  }

  const monthLabel = new Date(month).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  const totalRows = rows.length;
  const inPortal = rows.filter((r) => r.profile_id != null).length;
  const poolOnly = totalRows - inPortal;

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
            <p className="eyebrow mb-2">Admin · LIVE-Analyse</p>
            <h1 className="heading-display text-cream text-3xl md:text-4xl">
              LIVE-Analyse · {monthLabel}
            </h1>
            <p className="text-cream/50 text-sm mt-2">
              {totalRows} Creator · {inPortal} im Portal · {poolOnly} nur Backstage
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-5 border-b border-champagne/15 pb-3">
          {TABS.map((t) => {
            const active = t.key === activeTab;
            return (
              <a
                key={t.key}
                href={`?tab=${t.key}`}
                className={`text-[11px] uppercase tracking-[0.2em] px-3 py-2 transition-all ${
                  active
                    ? "bg-champagne text-ink"
                    : "border border-champagne/30 text-cream/70 hover:border-champagne hover:text-champagne"
                }`}
              >
                {t.emoji} {t.label}
              </a>
            );
          })}
        </div>

        {/* BESCHREIBUNG + LEGENDE */}
        <div className="mb-5 border-l-2 border-champagne/40 pl-4">
          <p className="text-cream/85 text-sm mb-3">
            {tab.beschreibung}
          </p>
          <ul className="text-cream/55 text-xs space-y-1">
            {tab.legende.map((l) => (
              <li key={l.term}>
                <span className="text-champagne/80">{l.term}:</span>{" "}
                <span>{l.def}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* DAILY RANKING (V8.1) — Spezial-Card-Render statt Tabelle */}
        {activeTab === "daily" && (
          <DailyRankingCards rows={rows} lastSyncIso={lastSyncIso} monthLabel={monthLabel} />
        )}

        {/* TABELLE */}
        {activeTab !== "daily" && (rows.length === 0 ? (
          <div className="border border-champagne/15 p-7 text-center">
            <p className="text-cream/55">
              Noch keine Backstage-Daten fuer {monthLabel}. Sobald der naechste
              Daily-Run gelaufen ist, erscheint hier die Auswertung.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-champagne/15">
            <table className="w-full text-sm">
              <thead className="bg-champagne/5">
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-cream/55">
                  <th className="px-3 py-3">#</th>
                  {tab.columns.map((c) => (
                    <th
                      key={c.key}
                      className={`px-3 py-3 ${
                        c.align === "right" ? "text-right" :
                        c.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pb = portalBadge(r.profile_id, r.portal_status);
                  const ab = activityBadge(r.activity_status);
                  const poolOnly = r.profile_id === null;
                  return (
                    <tr
                      key={r.metric_id}
                      className={`border-t border-champagne/10 hover:bg-champagne/[0.03] ${
                        poolOnly ? "opacity-75" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-cream/40 font-display italic text-base">
                        {i + 1}
                      </td>
                      {tab.columns.map((c) => {
                        // Custom-Cells fuer Badges (status_badge + onboarding + activity)
                        if (c.key === "status_badge") {
                          return (
                            <td key={c.key} className="px-3 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${pb.cls}`}>
                                {pb.label}
                              </span>
                            </td>
                          );
                        }
                        if (c.key === "onboarding") {
                          const obLabel = r.profile_id == null
                            ? "—"
                            : r.onboarding_completed
                              ? "onboarded"
                              : "pending";
                          const obCls = r.profile_id == null
                            ? "border border-cream/15 text-cream/35"
                            : r.onboarding_completed
                              ? "border border-champagne/30 text-champagne/80"
                              : "border border-yellow-400/40 text-yellow-300/85";
                          return (
                            <td key={c.key} className="px-3 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${obCls}`}>
                                {obLabel}
                              </span>
                            </td>
                          );
                        }
                        if (c.key === "activity") {
                          return (
                            <td key={c.key} className="px-3 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${ab.cls}`}>
                                {ab.label}
                              </span>
                            </td>
                          );
                        }
                        if (c.key === "creator") {
                          return (
                            <td key={c.key} className="px-3 py-3">
                              <div className="text-cream font-medium">
                                {r.display_name || r.tiktok_username}
                              </div>
                              <div className="text-cream/45 text-xs">
                                @{r.tiktok_username}
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td
                            key={c.key}
                            className={`px-3 py-3 ${
                              c.align === "right" ? "text-right text-cream/80" :
                              c.align === "center" ? "text-center" :
                              "text-left"
                            }`}
                          >
                            {c.render(r)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        <p className="text-cream/35 text-xs mt-6 leading-relaxed max-w-3xl">
          Quelle: Backstage Anchor-Detail-Page pro Creator, aggregiert in
          creator_monthly_metrics (Migration 0046, handle-keyed).
          Daily-Sync: 09:00 · 14:00 · 19:00 · 02:00 Berlin.
          „Nur Backstage" = Creator existiert in Backstage, hat aber noch
          kein Portal-Profile. Sobald er sich registriert, wird die Historie
          via Trigger automatisch zugeordnet (kein History-Verlust).
        </p>
      </main>
    </>
  );
}

// ============================================================
// DAILY RANKING CARDS (V8.1)
// ============================================================
// Screenshot-freundliche Top-3-Cards aus 7 Performance-Kategorien.
// Diamanten-Karte zeigt BEWUSST keine Werte (User-Decision: keine
// internen Umsatz-Zahlen in Posts/Gruppen leaken). Andere Karten
// zeigen die echte Kennzahl.
// Portalstatus wird NICHT in Daily-Ranking aufgenommen.

interface DailyCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  entries: Array<{ rank: number; name: string; value?: string }>;
  showValues?: boolean;
}

function DailyCard({ emoji, title, subtitle, entries, showValues }: DailyCardProps) {
  return (
    <div className="border border-champagne/20 p-5 md:p-6 bg-ink/40">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-xl md:text-2xl">{emoji}</span>
        <h3 className="font-display italic text-cream text-lg md:text-xl leading-tight">
          {title}
        </h3>
      </div>
      <p className="text-cream/55 text-xs mb-4 leading-relaxed">{subtitle}</p>
      {entries.length === 0 ? (
        <p className="text-cream/35 text-xs italic">Noch keine Daten</p>
      ) : (
        <ol className="space-y-2">
          {entries.map((e) => (
            <li key={e.rank} className="flex items-baseline justify-between gap-3 border-b border-champagne/8 pb-2 last:border-b-0">
              <span className="text-cream text-sm md:text-base">
                <span className="text-champagne font-display italic mr-2">{e.rank}.</span>
                {e.name}
              </span>
              {showValues && e.value && (
                <span className="text-cream/70 text-sm md:text-base font-medium tabular-nums">
                  {e.value}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function pickTop3<T>(
  rows: T[],
  sortKey: (r: T) => number,
  renderValue: (r: T) => string,
  renderName: (r: T) => string,
): Array<{ rank: number; name: string; value: string }> {
  const sorted = [...rows]
    .filter((r) => sortKey(r) > 0) // Nur Creator mit Daten in dieser Kategorie
    .sort((a, b) => sortKey(b) - sortKey(a))
    .slice(0, 3);
  return sorted.map((r, i) => ({
    rank: i + 1,
    name: renderName(r),
    value: renderValue(r),
  }));
}

interface DailyRankingCardsProps {
  rows: Row[];
  lastSyncIso: string | null;
  monthLabel: string;
}

function DailyRankingCards({ rows, lastSyncIso, monthLabel }: DailyRankingCardsProps) {
  const nameOf = (r: Row) => r.display_name || r.tiktok_username;

  const diamanten     = pickTop3(rows, (r) => r.diamonds_month ?? 0,        () => "", nameOf);
  const liveStunden   = pickTop3(rows, (r) => r.live_minutes_total,         (r) => fmtHours(r.live_minutes_total, r.live_hours_display), nameOf);
  const liveTage      = pickTop3(rows, (r) => r.valid_live_days,            (r) => `${r.valid_live_days} Tage`, nameOf);
  const zuschauer     = pickTop3(rows, (r) => r.approx_total_viewers,       (r) => fmtInt(r.approx_total_viewers), nameOf);
  const neueFollower  = pickTop3(rows, (r) => r.followers_gained ?? 0,      (r) => fmtInt(r.followers_gained), nameOf);
  const schenkende    = pickTop3(rows, (r) => r.gifters_count ?? 0,         (r) => fmtInt(r.gifters_count), nameOf);
  const wiedergabe    = pickTop3(rows, (r) => r.watchtime_avg_seconds ?? 0, (r) => fmtSeconds(r.watchtime_avg_seconds), nameOf);

  const standLabel = lastSyncIso
    ? new Date(lastSyncIso).toLocaleString("de-DE", {
        timeZone: "Europe/Berlin",
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <section>
      {/* Headline-Block für Screenshot */}
      <div className="border border-champagne/30 bg-ink/60 p-5 md:p-7 mb-5">
        <p className="eyebrow mb-2">ZOE⭐ Daily Ranking</p>
        <h2 className="font-display italic text-cream text-2xl md:text-3xl leading-tight">
          {monthLabel}
        </h2>
        <p className="text-cream/55 text-xs mt-2">
          Stand: {standLabel} Berlin
        </p>
      </div>

      {/* 7 Cards · 1-spaltig mobile, 2-spaltig md, 3-spaltig lg */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <DailyCard
          emoji="💎"
          title="Diamanten"
          subtitle="Wer aktuell die meisten Diamanten gesammelt hat."
          entries={diamanten}
          showValues={false}
        />
        <DailyCard
          emoji="⏱"
          title="LIVE-Stunden"
          subtitle="Wer am meisten LIVE-Zeit aufgebaut hat."
          entries={liveStunden}
          showValues={true}
        />
        <DailyCard
          emoji="🔥"
          title="LIVE-Tage"
          subtitle="Wer am regelmaessigsten LIVE war."
          entries={liveTage}
          showValues={true}
        />
        <DailyCard
          emoji="👀"
          title="Zuschauer"
          subtitle="Wer die meisten Zuschauer erreicht hat."
          entries={zuschauer}
          showValues={true}
        />
        <DailyCard
          emoji="📈"
          title="Neue Follower"
          subtitle="Wer aktuell am staerksten waechst."
          entries={neueFollower}
          showValues={true}
        />
        <DailyCard
          emoji="👤"
          title="Schenkende"
          subtitle="Wer die meisten unterschiedlichen Unterstuetzer hatte."
          entries={schenkende}
          showValues={true}
        />
        <DailyCard
          emoji="⏳"
          title="Wiedergabezeit"
          subtitle="Bei wem Zuschauer am laengsten im LIVE bleiben."
          entries={wiedergabe}
          showValues={true}
        />
      </div>

      <p className="text-cream/35 text-xs mt-5 leading-relaxed max-w-3xl">
        Quelle: Backstage Anchor-Detail · Daily-Sync 02/09/14/19 Berlin.
        Diamanten-Karte zeigt bewusst nur Reihenfolge ohne Werte.
      </p>
    </section>
  );
}
