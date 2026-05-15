// MonthlyMetricsBlock — Server-Component
// Zeigt aktuelle creator_monthly_metrics fuer den eingeloggten User.
// Bei 0 Rows: ruhiger Empty-State, kein Fake-Data.

import type { SupabaseClient } from "@supabase/supabase-js";

interface Metric {
  valid_live_days: number;
  live_minutes_total: number;
  live_hours_display: number | null;
  average_viewers: number;
  last_live_date: string | null;
  activity_status: "aktiv" | "unregelmaessig" | "inaktiv" | null;
  synced_at: string;
  month: string;
}

interface Props {
  supabase: SupabaseClient;
  profileId: string;
}

function firstDayOfMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function formatHours(minutes: number, displayHours: number | null): string {
  if (displayHours != null) {
    return displayHours.toString().replace(".", ",");
  }
  if (minutes <= 0) return "0";
  return (minutes / 60).toFixed(1).replace(".", ",");
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

function formatSync(ts: string): string {
  return new Date(ts).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDayDe(d: Date): string {
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Zeitraum-Label: "Zeitraum: 01.MM.YYYY – DD.MM.YYYY"
// upperBound = synced_at (Date des letzten Server-Stands), sonst null → "heute".
function rangeLabel(monthIso: string, upperBound: string | null): string {
  const [y, m] = monthIso.split("-").map((s) => parseInt(s, 10));
  const start = new Date(y, m - 1, 1);
  const end = upperBound ? new Date(upperBound) : null;
  return `Zeitraum: ${formatDayDe(start)} – ${end ? formatDayDe(end) : "heute"}`;
}

const STATUS_LABEL: Record<NonNullable<Metric["activity_status"]>, string> = {
  aktiv: "Aktiv",
  unregelmaessig: "Unregelmaessig",
  inaktiv: "Inaktiv",
};

const STATUS_TONE: Record<NonNullable<Metric["activity_status"]>, string> = {
  aktiv: "bg-champagne text-ink",
  unregelmaessig: "border border-champagne/40 text-champagne",
  inaktiv: "border border-cream/20 text-cream/55",
};

export async function MonthlyMetricsBlock({ supabase, profileId }: Props) {
  const now = new Date();
  const month = firstDayOfMonth(now);

  const { data } = await supabase
    .from("creator_monthly_metrics")
    .select(
      "valid_live_days, live_minutes_total, live_hours_display, average_viewers, last_live_date, activity_status, synced_at, month",
    )
    .eq("profile_id", profileId)
    .eq("month", month)
    .maybeSingle<Metric>();

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-6">
        <p className="eyebrow">Dein Monatsstand · {monthLabel(now)}</p>
        {data?.activity_status && (
          <span
            className={`inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[data.activity_status]}`}
          >
            {STATUS_LABEL[data.activity_status]}
          </span>
        )}
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-champagne/15">
            <Cell value={String(data.valid_live_days)} label="Gueltige LIVE-Tage" />
            <Cell value={formatHours(data.live_minutes_total, data.live_hours_display)} label="LIVE-Stunden" />
            <Cell value={String(data.average_viewers)} label="Ø Zuschauer" />
            <Cell value={formatDate(data.last_live_date)} label="Letzter LIVE-Tag" />
          </div>
          <p className="text-cream/40 text-xs mt-3">
            {rangeLabel(data.month, data.synced_at)} · Stand: {formatSync(data.synced_at)} Uhr
          </p>
        </>
      ) : (
        <div className="border border-champagne/15 p-7 md:p-9">
          <p className="font-display italic text-cream text-2xl md:text-3xl leading-snug mb-3">
            Deine Monatsdaten <span className="text-champagne">werden aktuell vorbereitet.</span>
          </p>
          <p className="text-cream/55 text-sm md:text-base leading-relaxed mb-4 max-w-[44ch]">
            Sobald der Daten-Sync aktiv ist, siehst du hier deine laufenden
            LIVE-Zahlen fuer den aktuellen Monat — gueltige LIVE-Tage,
            LIVE-Stunden, durchschnittliche Zuschauer und letzter LIVE-Tag.
          </p>
          <p className="text-cream/40 text-xs">
            {rangeLabel(month, null)}
          </p>
        </div>
      )}
    </section>
  );
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-ink p-5 md:p-7">
      <p className="font-display italic font-black text-champagne text-3xl md:text-4xl lg:text-5xl leading-none mb-2 md:mb-3 tracking-[-0.02em]">
        {value}
      </p>
      <p className="text-cream/65 text-xs md:text-sm leading-tight">{label}</p>
    </div>
  );
}
