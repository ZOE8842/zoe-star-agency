"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProfileShape {
  id: string;
  display_name: string | null;
  tiktok_username: string | null;
  country: string | null;
  language: string | null;
  bio: string | null;
  telegram_username?: string | null;
  whatsapp_number?: string | null;
  instagram_username?: string | null;
  birthday_day?: number | null;
  birthday_month?: number | null;
}

const MONTHS = [
  { v: 1, l: "Januar" }, { v: 2, l: "Februar" }, { v: 3, l: "Maerz" },
  { v: 4, l: "April" }, { v: 5, l: "Mai" }, { v: 6, l: "Juni" },
  { v: 7, l: "Juli" }, { v: 8, l: "August" }, { v: 9, l: "September" },
  { v: 10, l: "Oktober" }, { v: 11, l: "November" }, { v: 12, l: "Dezember" },
];

export function ProfileForm({ profile }: { profile: ProfileShape }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [tiktok, setTiktok] = useState(profile.tiktok_username || "");
  const [country, setCountry] = useState(profile.country || "DE");
  const [language, setLanguage] = useState(profile.language || "de");
  const [bio, setBio] = useState(profile.bio || "");
  const [telegram, setTelegram] = useState(profile.telegram_username || "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp_number || "");
  const [instagram, setInstagram] = useState(profile.instagram_username || "");
  const [bday, setBday] = useState<string>(profile.birthday_day ? String(profile.birthday_day) : "");
  const [bmonth, setBmonth] = useState<string>(profile.birthday_month ? String(profile.birthday_month) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);

    // Birthday muss vollstaendig oder leer sein (DSGVO · KEIN Jahr)
    if ((bday && !bmonth) || (bmonth && !bday)) {
      setError("Geburtstag bitte Tag + Monat zusammen, oder beides leer lassen.");
      setLoading(false); return;
    }
    if (whatsapp && !/^\+?[0-9 ()-]{4,32}$/.test(whatsapp)) {
      setError("WhatsApp-Nummer-Format ungueltig.");
      setLoading(false); return;
    }

    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        tiktok_username: tiktok.replace(/^@/, ""),
        country,
        language,
        bio: bio || null,
        telegram_username: telegram.replace(/^@/, "").trim() || null,
        whatsapp_number: whatsapp.trim() || null,
        instagram_username: instagram.replace(/^@/, "").trim() || null,
        birthday_day: bday ? parseInt(bday) : null,
        birthday_month: bmonth ? parseInt(bmonth) : null,
      })
      .eq("id", profile.id);

    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true); setLoading(false); router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-6 md:p-8 space-y-7">
      <p className="eyebrow mb-2">Profil bearbeiten</p>

      {/* CORE */}
      <Field label="Display Name">
        <input
          type="text" required value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="TikTok Username">
        <div className="flex items-center border border-champagne/30 focus-within:border-champagne">
          <span className="px-3 text-champagne">@</span>
          <input
            type="text" required value={tiktok}
            onChange={(e) => setTiktok(e.target.value.replace(/^@/, ""))}
            className="flex-1 bg-transparent py-3 pr-4 text-cream focus:outline-none text-base"
          />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Land">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectCls}>
            <option value="DE">Deutschland</option>
            <option value="AT">Oesterreich</option>
            <option value="CH">Schweiz</option>
            <option value="FR">Frankreich</option>
            <option value="TR">Tuerkei</option>
            <option value="IT">Italien</option>
            <option value="ES">Spanien</option>
            <option value="OTHER">Andere</option>
          </select>
        </Field>
        <Field label="Sprache">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="tr">Tuerkce</option>
            <option value="fr">Francais</option>
          </select>
        </Field>
      </div>

      <Field label="Bio (optional, max 300 Zeichen)">
        <textarea
          rows={3} value={bio} maxLength={300}
          onChange={(e) => setBio(e.target.value)}
          className={inputCls + " resize-none"}
        />
      </Field>

      {/* CONTACTS · neu */}
      <div className="pt-3 border-t border-champagne/10">
        <p className="eyebrow mb-3">Kontakte (optional)</p>
        <p className="text-cream/45 text-xs mb-4 leading-relaxed">
          Wenn du etwas hinterlegst, ist es fuer das ZOE-Team intern sichtbar.
          Nichts davon wird oeffentlich auf der Webseite gezeigt.
        </p>

        <div className="space-y-5">
          <Field label="Telegram-Username">
            <div className="flex items-center border border-champagne/30 focus-within:border-champagne">
              <span className="px-3 text-champagne">@</span>
              <input
                type="text" value={telegram} maxLength={64}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="dein_handle"
                className="flex-1 bg-transparent py-3 pr-4 text-cream focus:outline-none placeholder-cream/30 text-base"
              />
            </div>
          </Field>

          <Field label="WhatsApp-Nummer">
            <input
              type="tel" value={whatsapp} maxLength={32}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+49 ..."
              className={inputCls + " placeholder-cream/30"}
            />
          </Field>

          <Field label="Instagram-Username">
            <div className="flex items-center border border-champagne/30 focus-within:border-champagne">
              <span className="px-3 text-champagne">@</span>
              <input
                type="text" value={instagram} maxLength={64}
                onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                placeholder="dein_handle"
                className="flex-1 bg-transparent py-3 pr-4 text-cream focus:outline-none placeholder-cream/30 text-base"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* BIRTHDAY · DSGVO: nur Tag + Monat */}
      <div className="pt-3 border-t border-champagne/10">
        <p className="eyebrow mb-3">Geburtstag <span className="text-cream/35 normal-case tracking-normal">— Damit wir dir gratulieren koennen</span></p>
        <p className="text-cream/45 text-xs mb-4">Tag + Monat reichen, kein Jahr. Bleibt intern.</p>
        <div className="grid grid-cols-2 gap-3">
          <select value={bday} onChange={(e) => setBday(e.target.value)} className={selectCls}>
            <option value="">— Tag —</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select value={bmonth} onChange={(e) => setBmonth(e.target.value)} className={selectCls}>
            <option value="">— Monat —</option>
            {MONTHS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>}
      {success && <div className="border border-champagne/40 bg-champagne/5 px-4 py-3 text-champagne text-sm">Gespeichert.</div>}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Speichere…" : "Profil speichern"}
      </button>
    </form>
  );
}

const inputCls = "w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none text-base";
const selectCls = "w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">{label}</label>
      {children}
    </div>
  );
}
