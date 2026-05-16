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

function buildInsights(m: Metric | null, firstName: string): InsightTexts {
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

  // Inaktiv (Sonderfall) — sanft, einladend, kein Vorwurf
  if (days === 0) {
    return {
      strong: [],
      brake: [
        `${firstName}, dein Monat ist noch komplett offen. Du warst diesen Monat noch nicht live — und genau da liegt aktuell deine grösste Chance.`,
        "Ein erster regelmäßiger LIVE-Tag reicht schon, um wieder ins Sichtfeld vom Algorithmus zu kommen.",
      ],
      actions: [
        "Diese Woche einen festen LIVE-Tag setzen",
        "30 Minuten vorher eine kurze Story posten",
        "Mindestens 61 Minuten am Stück streamen",
      ],
      isInactive: true,
      isEmpty: false,
    };
  }

  // ---------- 🔥 Was läuft stark (max 2 spezifische Sätze, sonst Fallback) ----------
  const strong: string[] = [];
  // Top-Signal zuerst (höchster Aussagewert)
  if (wt >= 60) {
    strong.push("Deine Zuschauer bleiben deutlich länger im Stream als der Durchschnitt. Das ist ein starkes Zeichen für deine LIVE-Energie.");
  } else if (gr >= 2.5) {
    strong.push("Deine Community schenkt überdurchschnittlich aktiv. Das zeigt echte Bindung, nicht nur kurze Aufmerksamkeit.");
  } else if (ctr >= 50) {
    strong.push("Deine Reichweite läuft stark. Viele klicken aktiv von aussen in dein LIVE rein.");
  } else if (avg >= 3000) {
    strong.push("Deine Zuschauerzahlen sind solide. Wer reinkommt, bleibt eine Weile dabei.");
  } else if (days >= 8 && hours >= 20) {
    strong.push("Deine Konstanz stimmt. Du bist regelmäßig sichtbar — TikTok bekommt stabile Signale von dir.");
  } else {
    strong.push("Wenn du live bist, läuft es. Die Daten zeigen das deutlich.");
  }

  // Zweites Signal nur wenn deutlich anderer Aspekt
  if (strong.length === 1) {
    if (fol >= 300 && !strong[0].includes("Reichweite")) {
      strong.push("Dein Account wächst diesen Monat sichtbar — neue Leute finden dich gerade aktiv.");
    } else if (dmd >= 300000 && !strong[0].includes("Community")) {
      strong.push("Deine Diamanten zeigen klar: deine LIVEs treffen aktuell den richtigen Nerv.");
    }
  }

  // ---------- ⚠️ Was bremst — als zusammenhängender Coaching-Text mit Absätzen ----------
  // Strategie: 1 Hauptproblem identifizieren, sanft mit Anerkennung einleiten,
  // dann das Problem klar benennen — kein Bullet-Spam.
  const brake: string[] = [];
  const hasFrequency  = days < 8;
  const hasHours      = hours < 20;
  const hasPause      = since !== null && since >= 3 && days > 0;
  const hasWatchtime  = wt > 0 && wt < 20;
  const hasDiscovery  = ctr > 0 && ctr < 25;

  if (hasFrequency || hasHours || hasPause) {
    // Frequenz-/Konstanz-Bündel (höchste Prio)
    brake.push("Du performst stark, sobald du live bist — das siehst du an deinen aktuellen Zahlen.");
    if (hasFrequency && hasHours) {
      brake.push("Das eigentliche Thema ist gerade Konstanz. Du liegst noch unter dem Mindestziel von 8 LIVE-Tagen und 20 LIVE-Stunden im Monat — und genau das drückt deine Reichweite künstlich nach unten.");
    } else if (hasFrequency) {
      brake.push("Was dir gerade fehlt, ist Konstanz. Du liegst noch unter dem Mindestziel von 8 LIVE-Tagen — und genau das drückt deine Reichweite künstlich nach unten.");
    } else if (hasHours) {
      brake.push("Was dir gerade fehlt, sind Stunden pro Stream. Du bist regelmäßig dabei, aber unter den 20 LIVE-Stunden als Monats-Standard.");
    }
    if (hasPause) {
      brake.push(`Dein letztes LIVE ist ${since} Tage her. TikTok verliert in der Zeit wichtige Aktivitätssignale — wenige Tage Pause kosten oft mehr Reichweite als man denkt.`);
    }
  } else if (hasWatchtime) {
    brake.push("Du bringst Leute rein — aber sie steigen aktuell schneller wieder aus.");
    brake.push("Der Einstieg ins LIVE entscheidet das. Die ersten 30-60 Sekunden müssen sofort Energie und klare Ansage liefern.");
  } else if (hasDiscovery) {
    brake.push("Deine Streams sind solide — aber TikTok zeigt sie aktuell nur einem kleinen Publikum.");
    brake.push("Mit mehr Ankündigungen vor dem Start (Story, Push, kurzes Video) holst du schnell mehr Leute direkt zum LIVE-Beginn.");
  } else {
    brake.push("Du performst aktuell stabil. Wenn du den Rhythmus hältst, bleiben deine Zahlen stark.");
  }

  // ---------- 🎯 Empfehlungen (max 3, prioritiert) ----------
  const actions: string[] = [];
  if (hasPause)      actions.push("Diese Woche schnell wieder live gehen — Momentum nicht verlieren");
  if (hasFrequency)  actions.push("Auf 8 gültige LIVE-Tage diesen Monat kommen");
  if (hasHours)      actions.push("Mindestens 61 Minuten pro Stream — bringt dich auf 20 LIVE-Stunden");
  if (hasDiscovery)  actions.push("30 Minuten vor LIVE eine Story posten");
  if (hasWatchtime)  actions.push("Stärkerer Einstieg — sofort Energie in den ersten Sekunden");
  // Fallbacks wenn alles top läuft
  if (actions.length === 0) {
    actions.push("Feste Abendzeiten beibehalten");
    actions.push("Story 30 Min vor LIVE als festen Standard");
    actions.push("Community-Aufbau vor jedem Match einplanen");
  }
  // Cap auf 3 (Priorität: Pause > Frequenz > Stunden > Discovery > Watchtime)
  while (actions.length > 3) actions.pop();

  return {
    strong: strong.slice(0, 2),
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

  const insights = buildInsights(data, firstName);

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
