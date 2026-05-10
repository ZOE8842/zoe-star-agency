"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitPhoneRequest } from "./actions";
import {
  PHONE_CHANNELS,
  PHONE_CHANNEL_LABEL,
  PHONE_STATUS_LABEL,
  PHONE_STATUS_TONE,
  type PhoneChannel,
} from "@/lib/services/phone";

interface ProfileChannels {
  telegram_username: string | null;
  instagram_username: string | null;
  whatsapp_url: string | null;
}

interface HistoryRow {
  id: string;
  channel: string;
  contact_value: string;
  earliest_at: string;
  latest_at: string;
  status: string;
  note: string | null;
  created_at: string;
}

interface Props {
  channels: ProfileChannels;
  history: HistoryRow[];
}

function defaultISO(daysAhead: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  // datetime-local format YYYY-MM-DDTHH:MM
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PhoneForm({ channels, history }: Props) {
  const router = useRouter();
  const [channel, setChannel] = useState<PhoneChannel | "">(() => {
    if (channels.telegram_username) return "telegram";
    if (channels.whatsapp_url) return "whatsapp";
    if (channels.instagram_username) return "instagram";
    return "";
  });
  const [contactValue, setContactValue] = useState(() => {
    if (channels.telegram_username) return `@${channels.telegram_username}`;
    if (channels.whatsapp_url) return channels.whatsapp_url;
    if (channels.instagram_username) return `@${channels.instagram_username}`;
    return "";
  });
  const [earliestLocal, setEarliestLocal] = useState(() => defaultISO(1, 14));
  const [latestLocal, setLatestLocal] = useState(() => defaultISO(1, 20));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onChannel = (next: PhoneChannel) => {
    setChannel(next);
    if (next === "telegram" && channels.telegram_username)
      setContactValue(`@${channels.telegram_username}`);
    else if (next === "whatsapp" && channels.whatsapp_url)
      setContactValue(channels.whatsapp_url);
    else if (next === "instagram" && channels.instagram_username)
      setContactValue(`@${channels.instagram_username}`);
    else setContactValue("");
  };

  const ready = useMemo(
    () => !!channel && !!contactValue.trim() && !!earliestLocal && !!latestLocal,
    [channel, contactValue, earliestLocal, latestLocal],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !channel) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const r = await submitPhoneRequest({
      channel,
      contact_value: contactValue,
      earliest_at: new Date(earliestLocal).toISOString(),
      latest_at: new Date(latestLocal).toISOString(),
      note: note || undefined,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error || "Konnte nicht speichern.");
      return;
    }
    setInfo("Gespeichert. Wir melden uns im gewaehlten Zeitfenster.");
    setNote("");
    router.refresh();
  };

  return (
    <>
      <section className="border border-champagne/15 p-5 md:p-7 mb-10">
        <p className="eyebrow mb-5">Wann duerfen wir dich erreichen?</p>

        <form onSubmit={submit} className="space-y-7">
          {/* Channel-Toggle */}
          <div>
            <label className="eyebrow text-cream/65 mb-2.5 block">Kontakt-Kanal</label>
            <div className="flex flex-wrap gap-2">
              {PHONE_CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChannel(c)}
                  className={`px-4 py-2.5 text-sm border transition-all ${
                    channel === c
                      ? "border-champagne bg-champagne/10 text-champagne"
                      : "border-champagne/20 text-cream/70 hover:border-champagne/50 hover:text-cream"
                  }`}
                >
                  {channel === c && <span className="mr-1.5">✓</span>}
                  {PHONE_CHANNEL_LABEL[c]}
                </button>
              ))}
            </div>
            <p className="text-cream/35 text-xs mt-2">
              {channel === "whatsapp"
                ? "Link (wa.me/...) oder Nummer. Nummer ist fuer das ZOE Team sichtbar."
                : "Telegram/Instagram werden privat genutzt — nur fuer ZOE."}
            </p>
          </div>

          {/* Contact-Value */}
          <div>
            <label className="eyebrow text-cream/65 mb-2.5 block">Erreichbar unter</label>
            <input
              type="text"
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={
                channel === "whatsapp" ? "https://wa.me/49..." :
                channel === "telegram" ? "@username" :
                channel === "instagram" ? "@handle" :
                "kanal zuerst waehlen"
              }
              maxLength={200}
              className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none"
            />
          </div>

          {/* Time-Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="eyebrow text-cream/65 mb-2.5 block">Frueheste Zeit</label>
              <input
                type="datetime-local"
                value={earliestLocal}
                onChange={(e) => setEarliestLocal(e.target.value)}
                className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow text-cream/65 mb-2.5 block">Spaeteste Zeit</label>
              <input
                type="datetime-local"
                value={latestLocal}
                onChange={(e) => setLatestLocal(e.target.value)}
                className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-cream/35 text-xs leading-relaxed">
            Mind. 5 Stunden Zeitfenster, zwischen 09:00 und 22:00 Uhr.
            Kein Sofort-Termin — wir melden uns innerhalb deines Fensters.
          </p>

          {/* Note */}
          <div>
            <label className="eyebrow text-cream/65 mb-2.5 block">Worum gehts? (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 240))}
              maxLength={240}
              placeholder="z.B. Match-Anfrage besprechen"
              className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none"
            />
          </div>

          {error && <p className="text-champagne/70 text-xs italic">{error}</p>}
          {info && <p className="text-champagne/85 text-xs italic">{info}</p>}

          <button
            type="submit"
            disabled={!ready || submitting}
            className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Sende…" : "Gespraech anfragen"}
            {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
          </button>
        </form>
      </section>

      {history.length > 0 && (
        <section>
          <p className="eyebrow mb-4">Deine Anfragen</p>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="border-t border-champagne/10 last:border-b py-3">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="text-cream text-sm md:text-base">
                    {PHONE_CHANNEL_LABEL[h.channel as PhoneChannel] ?? h.channel} ·{" "}
                    <span className="text-cream/55">{h.contact_value}</span>
                  </p>
                  <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${PHONE_STATUS_TONE[h.status] ?? ""}`}>
                    {PHONE_STATUS_LABEL[h.status] ?? h.status}
                  </span>
                </div>
                <p className="text-cream/45 text-xs mt-1">
                  {new Date(h.earliest_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                  {" — "}
                  {new Date(h.latest_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                {h.note && (
                  <p className="text-cream/55 text-xs italic mt-1">„{h.note}"</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
