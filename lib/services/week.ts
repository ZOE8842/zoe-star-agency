// Wochen-Helper fuer TikTok Push.
// Wir nehmen IMMER die naechste komplette Woche
// (Mo 00:00 - So 23:59), Slot-Range Mo 00:00 - So 18:00.

export function nextMonday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  // 0=So, 1=Mo, ... 6=Sa
  const dow = d.getDay();
  // Tage bis zum naechsten Montag (immer >0, keine "diese Woche")
  const daysToNextMon = ((8 - dow) % 7) || 7;
  d.setDate(d.getDate() + daysToNextMon);
  return d;
}

export function weekKey(monday: Date): string {
  // YYYY-MM-DD
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekRangeLabel(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  return `${fmt(monday)} – ${fmt(sun)}`;
}

export function dayLabel(monday: Date, offset: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

// Slot-Validation: Mo 00:00 - So 18:00 erlaubt.
export interface SlotInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_min: number;
}

export function validateSlots(
  slots: SlotInput[],
  weekMonday: Date,
): { ok: boolean; error?: string } {
  if (slots.length === 0) {
    return { ok: false, error: "Mindestens eine Wunschzeit angeben." };
  }
  if (slots.length > 3) {
    return { ok: false, error: "Maximal drei Wunschzeiten." };
  }
  const sun = new Date(weekMonday);
  sun.setDate(sun.getDate() + 6);
  for (const s of slots) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) {
      return { ok: false, error: "Datum ungueltig." };
    }
    if (!/^\d{2}:\d{2}$/.test(s.time)) {
      return { ok: false, error: "Uhrzeit ungueltig." };
    }
    if (
      typeof s.duration_min !== "number" ||
      s.duration_min < 30 ||
      s.duration_min > 240
    ) {
      return { ok: false, error: "Dauer 30-240 Minuten." };
    }
    const dt = new Date(`${s.date}T${s.time}:00`);
    if (Number.isNaN(dt.getTime())) {
      return { ok: false, error: "Datum/Uhrzeit-Kombination ungueltig." };
    }
    if (dt < weekMonday) {
      return { ok: false, error: "Wunschzeit muss in der naechsten Woche liegen." };
    }
    // So 18:00 = monday + 6 Tage 18:00
    const sunCutoff = new Date(weekMonday);
    sunCutoff.setDate(sunCutoff.getDate() + 6);
    sunCutoff.setHours(18, 0, 0, 0);
    if (dt > sunCutoff) {
      return { ok: false, error: "Wunschzeit nur bis Sonntag 18:00 erlaubt." };
    }
  }
  return { ok: true };
}

export const PUSH_STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  reviewed: "Geprueft",
  selected: "Ausgewaehlt",
  not_selected: "Nicht ausgewaehlt",
  cancelled: "Storniert",
};

export const PUSH_STATUS_TONE: Record<string, string> = {
  submitted: "border border-champagne/40 text-champagne",
  reviewed: "border border-cream/30 text-cream/80",
  selected: "bg-champagne text-ink",
  not_selected: "border border-cream/15 text-cream/45",
  cancelled: "border border-cream/15 text-cream/45 line-through",
};
