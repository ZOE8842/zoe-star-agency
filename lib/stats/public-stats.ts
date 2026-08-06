// Aggregierte Agency-Kennzahlen fuer die oeffentlichen Seiten.
// Genutzt von:
//   - app/page.tsx           → Hero-Quick-Stats
//   - app/about/page.tsx     → Zahlen-Block
//   - app/kooperationen/page → Stats-Leiste
//
// Warum es das gibt: Die Zahlen standen bis 2026-08-06 an drei Stellen
// hardcodiert im Code — auf dem Stand **April 2026**. Vier Monate zu alt,
// und niemand merkt es, weil nichts fehlschlaegt. Jetzt kommen sie aus
// `creator_daily_metrics` (dieselbe Quelle, die der Backstage-Sync fuellt).
//
// Bezugszeitraum ist bewusst der **letzte vollstaendige Monat**: der laufende
// Monat waere am 3. eines Monats laecherlich niedrig und wuerde die Agency
// schlechter aussehen lassen als sie ist.
//
// Service-Role-Client, weil `creator_daily_metrics` per RLS nicht public
// lesbar ist. Es werden ausschliesslich **Aggregate** nach aussen gegeben —
// keine Zahlen einzelner Creator.

import { createClient } from "@supabase/supabase-js";

export interface PublicAgencyStats {
  /** Creator mit mindestens einer LIVE-Minute im Bezugsmonat */
  activeCreators: number;
  /** Summe LIVE-Stunden im Bezugsmonat */
  liveHours: number;
  /** Tage, an denen ein Creator live war (Creator × Tag), im Bezugsmonat */
  liveDays: number;
  /** Ø LIVE-Stunden je aktivem Creator im Bezugsmonat */
  avgHoursPerCreator: number;
  /** Bezugsmonat als "YYYY-MM" */
  month: string;
  /** Bezugsmonat ausgeschrieben, z. B. "Juli 2026" */
  monthLabel: string;
  /** false = DB nicht erreichbar, es greifen die Fallback-Werte unten */
  isLive: boolean;
}

const MONTHS_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

// Letzter bekannter Stand (Juli 2026, aus creator_daily_metrics).
// Greift nur, wenn die DB nicht erreichbar ist — die Seite zeigt dann
// echte, wenn auch evtl. nicht taggenaue Zahlen statt Nullen oder Platzhalter.
const FALLBACK: PublicAgencyStats = {
  activeCreators: 60,
  liveHours: 2988,
  liveDays: 932,
  avgHoursPerCreator: 50,
  month: "2026-07",
  monthLabel: "Juli 2026",
  isLive: false,
};

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Erster und letzter Tag des letzten vollstaendigen Monats (ISO). */
function lastCompleteMonth(now = new Date()): { from: string; to: string; key: string; label: string } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-basiert, aktueller Monat
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // Tag 0 des aktuellen = letzter des Vormonats
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from: iso(start),
    to: iso(end),
    key: iso(start).slice(0, 7),
    label: `${MONTHS_DE[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
  };
}

/**
 * Aggregat-Kennzahlen des letzten vollstaendigen Monats.
 * Wirft nie — bei jedem Fehler kommen die FALLBACK-Werte zurueck, damit eine
 * DB-Stoerung nicht die halbe Startseite leer macht.
 */
export async function getPublicAgencyStats(): Promise<PublicAgencyStats> {
  const { from, to, key, label } = lastCompleteMonth();

  try {
    const { data, error } = await admin()
      .from("creator_daily_metrics")
      .select("tiktok_username, live_minutes")
      .gte("metric_date", from)
      .lte("metric_date", to)
      .gt("live_minutes", 0);

    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK;

    const creators = new Set<string>();
    let minutes = 0;
    for (const row of data) {
      if (row.tiktok_username) creators.add(row.tiktok_username);
      minutes += row.live_minutes ?? 0;
    }

    const activeCreators = creators.size;
    const liveHours = Math.round(minutes / 60);

    return {
      activeCreators,
      liveHours,
      liveDays: data.length,
      avgHoursPerCreator: activeCreators > 0 ? Math.round(liveHours / activeCreators) : 0,
      month: key,
      monthLabel: label,
      isLive: true,
    };
  } catch {
    // Bewusst still: eine kaputte Kennzahl darf keine Public-Seite umwerfen.
    return FALLBACK;
  }
}

/** 2988 -> "2.988+" (deutsche Tausenderpunkte, wie bisher auf den Seiten) */
export function formatStat(n: number): string {
  return `${n.toLocaleString("de-DE")}+`;
}
