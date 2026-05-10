// LIVE-Abmeldung Validation + Labels.

export const ABSENCE_REASONS = [
  "krank",
  "technik",
  "tiktok_sperre",
  "privat",
  "verschoben",
  "sonstiges",
] as const;
export type AbsenceReason = (typeof ABSENCE_REASONS)[number];

export const ABSENCE_REASON_LABEL: Record<AbsenceReason, string> = {
  krank: "Krank",
  technik: "Technik",
  tiktok_sperre: "TikTok Sperre",
  privat: "Privat",
  verschoben: "Verschoben",
  sonstiges: "Sonstiges",
};

export const ABSENCE_STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  seen: "Gesehen",
  resolved: "Geklaert",
};

export const ABSENCE_STATUS_TONE: Record<string, string> = {
  submitted: "border border-champagne/40 text-champagne",
  seen: "border border-cream/30 text-cream/80",
  resolved: "bg-champagne text-ink",
};

export interface AbsenceInput {
  reason: AbsenceReason;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  note?: string;
}

export function validateAbsence(input: AbsenceInput): { ok: boolean; error?: string } {
  if (!ABSENCE_REASONS.includes(input.reason)) {
    return { ok: false, error: "Bitte einen Grund waehlen." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.period_start)) {
    return { ok: false, error: "Startdatum ungueltig." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.period_end)) {
    return { ok: false, error: "Enddatum ungueltig." };
  }
  if (input.period_end < input.period_start) {
    return { ok: false, error: "Ende darf nicht vor Start liegen." };
  }
  if (input.reason === "sonstiges" && !(input.note || "").trim()) {
    return { ok: false, error: "Bei 'Sonstiges' bitte kurze Nachricht angeben." };
  }
  return { ok: true };
}
