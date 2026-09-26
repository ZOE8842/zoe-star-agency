// MonthlyGoalBlock — Server-Component
//
// Zeigt den Stand gegen die drei monatlichen Mindestwerte (8 gültige
// LIVE-Tage, 20 LIVE-Stunden, 8 Tage im Portal).
//
// Warum es das gibt: Seit 25.09.2026 stehen diese Werte öffentlich auf
// /join und in der FAQ. Das Portal zeigte bis dahin nur nackte Zahlen —
// "Gültige LIVE-Tage: 5" — ohne zu sagen, dass 8 nötig sind. Wer seine
// Zusage nicht nachverfolgen kann, kann sie auch nicht einhalten.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MONATSZIELE,
  bewerte,
  resttageImMonat,
  type Ampel,
} from "@/lib/creator/monatsziele";

interface Props {
  supabase: SupabaseClient;
  profileId: string;
}

function ersterTagDesMonats(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const AMPEL_FARBE: Record<Ampel, { balken: string; text: string }> = {
  erreicht: { balken: "bg-champagne", text: "text-champagne" },
  auf_kurs: { balken: "bg-champagne/70", text: "text-cream/70" },
  knapp: { balken: "bg-amber-400/80", text: "text-amber-300" },
  offen: { balken: "bg-cream/25", text: "text-cream/50" },
};

const AMPEL_TEXT: Record<Ampel, string> = {
  erreicht: "geschafft",
  auf_kurs: "auf Kurs",
  knapp: "wird knapp",
  offen: "diesen Monat nicht mehr",
};

export async function MonthlyGoalBlock({ supabase, profileId }: Props) {
  const jetzt = new Date();
  const monat = ersterTagDesMonats(jetzt);

  // LIVE-Zahlen des laufenden Monats
  const { data: metrik } = await supabase
    .from("creator_monthly_metrics")
    .select("valid_live_days, live_minutes_total")
    .eq("profile_id", profileId)
    .eq("month", monat)
    .maybeSingle<{ valid_live_days: number; live_minutes_total: number }>();

  // Portal-Tage: verschiedene Kalendertage mit mindestens einem Ereignis.
  // Nur der Tag zählt, nicht wie oft jemand geklickt hat.
  const { data: ereignisse } = await supabase
    .from("admin_analytics_events")
    .select("created_at")
    .eq("profile_id", profileId)
    .gte("created_at", `${monat}T00:00:00Z`);

  const portalTage = new Set(
    (ereignisse ?? []).map((e: { created_at: string }) =>
      new Date(e.created_at).toISOString().slice(0, 10),
    ),
  ).size;

  const stand: Record<string, number> = {
    live_tage: metrik?.valid_live_days ?? 0,
    live_stunden: Math.floor((metrik?.live_minutes_total ?? 0) / 60),
    portal_tage: portalTage,
  };

  const rest = resttageImMonat(jetzt);
  const monatName = jetzt.toLocaleDateString("de-DE", { month: "long" });
  const alleErreicht = MONATSZIELE.every((z) => stand[z.key] >= z.ziel);

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-6">
        <p className="eyebrow">Dein Monatsziel · {monatName}</p>
        <span className="text-cream/45 text-xs">
          {rest === 1 ? "letzter Tag" : `noch ${rest} Tage`}
        </span>
      </div>

      <div className="border border-champagne/15 p-6 md:p-8">
        {alleErreicht && (
          <p className="font-display italic text-champagne text-xl md:text-2xl leading-snug mb-7">
            Alle drei Werte stehen. Der Rest des Monats gehört dir.
          </p>
        )}

        <div className="space-y-7">
          {MONATSZIELE.map((z) => {
            const ist = stand[z.key] ?? 0;
            const ampel = bewerte(z.key, ist, jetzt);
            const farbe = AMPEL_FARBE[ampel];
            const anteil = Math.min(100, Math.round((ist / z.ziel) * 100));

            return (
              <div key={z.key}>
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <p className="text-cream text-sm md:text-base">{z.label}</p>
                  <p className="text-cream/50 text-xs md:text-sm tabular-nums">
                    <span className={`${farbe.text} font-medium`}>{ist}</span>
                    {" von "}
                    {z.ziel} {z.einheit}
                  </p>
                </div>

                {/* Balken: role=img, damit Screenreader nicht drei nackte
                    Divs vorlesen, sondern den Stand als Satz. */}
                <div
                  className="h-1.5 bg-cream/10 overflow-hidden"
                  role="img"
                  aria-label={`${z.label}: ${ist} von ${z.ziel} ${z.einheit}, ${AMPEL_TEXT[ampel]}`}
                >
                  <div
                    className={`h-full ${farbe.balken} transition-[width] duration-700`}
                    style={{ width: `${anteil}%` }}
                  />
                </div>

                <div className="flex items-baseline justify-between gap-4 mt-2">
                  <p className="text-cream/45 text-xs leading-relaxed max-w-[46ch]">
                    {z.beschreibung}
                  </p>
                  <p className={`${farbe.text} text-[10px] uppercase tracking-[0.2em] shrink-0`}>
                    {AMPEL_TEXT[ampel]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {!metrik && (
          <p className="text-cream/40 text-xs mt-7 leading-relaxed">
            Deine LIVE-Zahlen für diesen Monat sind noch nicht eingetroffen.
            TikTok liefert sie mit einem Tag Verzögerung — der Stand oben
            aktualisiert sich automatisch.
          </p>
        )}
      </div>
    </section>
  );
}
