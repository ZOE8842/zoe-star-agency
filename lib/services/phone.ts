// Phone-Termin Validation + Labels.
// Regeln: kein 22:00-09:00, mind. 5h Differenz, in der Zukunft.

export const PHONE_CHANNELS = ["telegram", "instagram", "whatsapp"] as const;
export type PhoneChannel = (typeof PHONE_CHANNELS)[number];

export const PHONE_CHANNEL_LABEL: Record<PhoneChannel, string> = {
  telegram: "Telegram",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
};

export const PHONE_STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  planned: "Geplant",
  done: "Erledigt",
  cancelled: "Abgelehnt",
};

export const PHONE_STATUS_TONE: Record<string, string> = {
  open: "border border-champagne/40 text-champagne",
  planned: "bg-champagne text-ink",
  done: "border border-cream/30 text-cream/80",
  cancelled: "border border-cream/15 text-cream/45 line-through",
};

export interface PhoneRequestInput {
  channel: PhoneChannel;
  contact_value: string;
  earliest_at: string; // ISO
  latest_at: string;   // ISO
  note?: string;
}

export function validatePhoneRequest(
  input: PhoneRequestInput,
  now: Date = new Date(),
): { ok: boolean; error?: string } {
  if (!PHONE_CHANNELS.includes(input.channel)) {
    return { ok: false, error: "Bitte einen Kontakt-Kanal waehlen." };
  }
  const cv = (input.contact_value || "").trim();
  if (cv.length === 0) {
    return { ok: false, error: "Bitte deinen Kontakt eintragen." };
  }
  if (input.channel === "whatsapp") {
    // Akzeptiere wa.me-Links ODER Nummer
    const looksLikeUrl = /^https?:\/\//i.test(cv);
    const looksLikeNumber = /^\+?[0-9 \-]{7,20}$/.test(cv);
    if (!looksLikeUrl && !looksLikeNumber) {
      return { ok: false, error: "WhatsApp: Link (wa.me/...) oder Nummer." };
    }
  }
  const earliest = new Date(input.earliest_at);
  const latest = new Date(input.latest_at);
  if (Number.isNaN(earliest.getTime()) || Number.isNaN(latest.getTime())) {
    return { ok: false, error: "Zeit ungueltig." };
  }
  if (earliest <= now) {
    return { ok: false, error: "Termin muss in der Zukunft liegen." };
  }
  const diffMs = latest.getTime() - earliest.getTime();
  const fiveHoursMs = 5 * 3600 * 1000;
  if (diffMs < fiveHoursMs) {
    return { ok: false, error: "Mindestens 5 Stunden Zeitfenster." };
  }
  // Kein 22-09: weder earliest noch latest darf in 22:00-09:00 fallen
  for (const d of [earliest, latest]) {
    const h = d.getHours();
    if (h >= 22 || h < 9) {
      return { ok: false, error: "Bitte zwischen 09:00 und 22:00 Uhr." };
    }
  }
  return { ok: true };
}
