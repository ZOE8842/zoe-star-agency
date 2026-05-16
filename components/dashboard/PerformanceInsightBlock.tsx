// PerformanceInsightBlock — Server-Component
// Kompakte coaching-orientierte Auswertung pro Creator direkt im Dashboard.
// Datenquelle: creator_monthly_metrics (Phase-5 KPIs).
// Stil: ruhig, hochwertig, motivierend — KEIN KPI-Spam, KEIN Datenreport.
// Wenn keine Daten (Empty oder Inaktiv-Special-Case) → eigene sanfte Variante.

import type { SupabaseClient } from "@supabase/supabase-js";

interface Metric {
  valid_live_days: number;
  live_minutes_total: number;
  average_viewers: number;
  diamonds_month: number | null;
  gift_rate: number | null;
  ctr: number | null;
  watchtime_avg_seconds: number | null;
  followers_gained: number | null;
  last_live_date: string | null;
  activity_status: "aktiv" | "unregelmaessig" | "inaktiv" | null;
}

interface Props {
  supabase: SupabaseClient;
  profileId: string;
  firstName: string;
}

function firstDayOfMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - d.getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

// Coaching-Text-Engine · 3 Sektionen.
// Wandelt KPI-Werte in natürliche kurze Coaching-Sätze (KEIN KPI-Spam).
interface InsightTexts {
  strong: string[];      // 1-3 kurze Sätze
  brake: string[];       // 1-3 kurze Sätze (eigene Absätze)
  actions: string[];     // 3-5 Bullets
  isInactive: boolean;
  isEmpty: boolean;
}

function buildInsights(m: Metric | null): InsightTexts {
  if (!m) {
    return {
      strong: [],
      brake: [],
      actions: [],
      isEmpty: true,
      isInactive: false,
    };
  }

  const days  = m.valid_live_days;
  const mins  = m.live_minutes_total;
  const hours = mins / 60;
  const ctr   = m.ctr ?? 0;
  const wt    = m.watchtime_avg_seconds ?? 0;
  const gr    = m.gift_rate ?? 0;
  const avg   = m.average_viewers;
  const dmd   = m.diamonds_month ?? 0;
  const fol   = m.followers_gained ?? 0;
  const since = daysSince(m.last_live_date);

  // Inaktiv (Sonderfall)
  if (days === 0) {
    return {
      strong: [],
      brake: [
        "Du warst diesen Monat noch nicht live.",
        "Schon ein erster regelmäßiger LIVE-Tag bringt dich wieder ins Sichtfeld vom Algorithmus.",
      ],
      actions: [
        "Diese Woche einen festen LIVE-Tag setzen",
        "Vorher kurze Story posten",
        "Mindestens 61 Minuten am Stück streamen",
        "Erstmal Community aufbauen, dann matchen",
      ],
      isInactive: true,
      isEmpty: false,
    };
  }

  // ---------- 🔥 Was läuft stark ----------
  const strong: string[] = [];
  if (wt >= 60) {
    strong.push("Deine Zuschauer bleiben deutlich länger im Stream als der Durchschnitt — das ist ein starkes Zeichen für deine LIVE-Energie.");
  } else if (avg >= 3000 && wt >= 25) {
    strong.push("Deine Zuschauerbindung ist gut. Wer reinkommt, bleibt eine Weile dabei.");
  }
  if (ctr >= 50) {
    strong.push("Deine Reichweite läuft stark — viele klicken aktiv von außen in dein LIVE rein.");
  } else if (ctr >= 35 && strong.length === 0) {
    strong.push("Deine Reichweite ist solide. TikTok pushed dich aktuell stabil.");
  }
  if (gr >= 2.5) {
    strong.push("Deine Community schenkt überdurchschnittlich aktiv — das zeigt echte Bindung.");
  }
  if (fol >= 200 && strong.length < 3) {
    strong.push("Dein Account wächst diesen Monat sichtbar.");
  }
  if (dmd >= 200000 && strong.length < 3) {
    strong.push("Deine Diamanten zeigen, dass deine LIVEs gerade richtig laufen.");
  }
  if (strong.length === 0 && days >= 8) {
    strong.push("Deine Konstanz ist gut — du bist regelmäßig sichtbar.");
  }
  if (strong.length === 0) {
    strong.push("Wenn du live bist, läuft es — die Daten zeigen das deutlich.");
  }

  // ---------- ⚠️ Was bremst ----------
  const brake: string[] = [];

  // Frequenz-Problem (höchste Prio)
  if (days < 8) {
    brake.push("Aktuell fehlt dir Konstanz. Du liegst unter dem Mindestziel von 8 gültigen LIVE-Tagen.");
    if (hours < 20) {
      brake.push("Auch die LIVE-Stunden sind noch unter den 20 Stunden, die du als Standard erreichen solltest.");
    } else {
      brake.push("Deine LIVE-Stunden sind stark — du musst nur wieder regelmäßiger online kommen.");
    }
  } else if (hours < 20) {
    brake.push("Du bist regelmäßig live, aber die Stunden pro Stream sind noch zu kurz. Mindestziel sind 20 LIVE-Stunden im Monat.");
  }

  // Pause-Warnung
  if (since !== null && since >= 3 && days > 0) {
    brake.push(`Dein letztes LIVE liegt ${since} Tage zurück — TikTok verliert dadurch wichtige Aktivitätssignale.`);
  }

  // Watchtime-Problem
  if (wt > 0 && wt < 20 && brake.length < 3) {
    brake.push("Deine Zuschauer steigen aktuell schnell wieder aus. Der Einstieg in dein LIVE muss stärker werden.");
  }

  // Discovery-Problem
  if (ctr > 0 && ctr < 25 && brake.length < 3) {
    brake.push("TikTok zeigt deinen LIVE aktuell nur wenigen — mehr Ankündigungen und Stories vor dem Start helfen.");
  }

  if (brake.length === 0) {
    brake.push("Du performst aktuell stabil. Wenn du den Rhythmus hältst, bleiben deine Zahlen stark.");
  }

  // ---------- 🎯 Empfehlungen ----------
  const actions: string[] = [];
  if (days < 8) actions.push("Wieder regelmäßiger LIVE gehen");
  if (hours < 20) actions.push("Mindestens 61 Minuten pro Stream");
  if (since !== null && since >= 3) actions.push("Diese Woche schnell wieder live gehen");
  if (ctr > 0 && ctr < 30) actions.push("30 Minuten vor LIVE eine Story posten");
  if (wt > 0 && wt < 20) actions.push("Starker Einstieg — sofort Energie und klare Ansage");
  if (gr > 0 && gr < 1) actions.push("Erst Community aufbauen, dann matchen");
  if (actions.length < 3) actions.push("Feste Abendzeiten nutzen");
  if (actions.length < 3) actions.push("Vorher ein kurzes Video posten");
  // Cap auf 5
  while (actions.length > 5) actions.pop();

  return {
    strong: strong.slice(0, 3),
    brake: brake.slice(0, 3),
    actions,
    isInactive: false,
    isEmpty: false,
  };
}

export async function PerformanceInsightBlock({ supabase, profileId, firstName }: Props) {
  const month = firstDayOfMonth(new Date());
  const { data } = await supabase
    .from("creator_monthly_metrics")
    .select(
      "valid_live_days, live_minutes_total, average_viewers, diamonds_month, gift_rate, ctr, watchtime_avg_seconds, followers_gained, last_live_date, activity_status",
    )
    .eq("profile_id", profileId)
    .eq("month", month)
    .maybeSingle<Metric>();

  const insights = buildInsights(data);

  // Empty-State (noch kein Sync) — sanft, nicht alarmierend
  if (insights.isEmpty) {
    return (
      <section className="mb-12 md:mb-16">
        <p className="eyebrow mb-5 md:mb-6">Dein Performance-Update</p>
        <div className="border border-champagne/15 p-6 md:p-7">
          <p className="text-cream/65 text-sm md:text-base leading-relaxed">
            Sobald deine ersten LIVE-Daten gesynct sind, findest du hier deine
            persönliche Einschätzung — was läuft, was du verbessern kannst und
            welche Schritte gerade am meisten bringen.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-6">
        <p className="eyebrow">Dein Performance-Update</p>
        <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
          Coaching · {firstName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-champagne/10">
        {/* 🔥 Stark */}
        <div className="bg-ink p-6 md:p-7">
          <p className="eyebrow text-champagne mb-4">🔥 Was gerade läuft</p>
          <div className="space-y-3">
            {insights.strong.map((s, i) => (
              <p key={i} className="text-cream/80 text-sm md:text-[15px] leading-relaxed">
                {s}
              </p>
            ))}
          </div>
        </div>

        {/* ⚠️ Bremst */}
        <div className="bg-ink p-6 md:p-7">
          <p className="eyebrow text-champagne/85 mb-4">⚠️ Was dich bremst</p>
          <div className="space-y-3">
            {insights.brake.map((b, i) => (
              <p key={i} className="text-cream/80 text-sm md:text-[15px] leading-relaxed">
                {b}
              </p>
            ))}
          </div>
        </div>

        {/* 🎯 Empfehlung */}
        <div className="bg-ink p-6 md:p-7">
          <p className="eyebrow text-champagne/85 mb-4">🎯 Empfehlung</p>
          <ul className="space-y-2">
            {insights.actions.map((a, i) => (
              <li key={i} className="text-cream/80 text-sm md:text-[15px] leading-relaxed flex gap-2">
                <span className="text-champagne shrink-0">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {insights.isInactive ? (
        <p className="text-cream/40 text-xs mt-3">
          Diese Einschätzung aktualisiert sich täglich um ca. 09:00 Uhr.
        </p>
      ) : (
        <p className="text-cream/40 text-xs mt-3">
          Persönliche Einschätzung basierend auf deinen aktuellen Monatsdaten · taeglich um ca. 09:00 Uhr aktualisiert
        </p>
      )}
    </section>
  );
}
