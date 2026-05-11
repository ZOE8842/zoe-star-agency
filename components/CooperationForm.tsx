"use client";

import { useEffect, useState } from "react";

const TYPES = [
  { value: "live_campaign", label: "TikTok LIVE Kampagne" },
  { value: "creator_coop", label: "Creator Kooperation" },
  { value: "product_placement", label: "Produktplatzierung" },
  { value: "event", label: "Event" },
  { value: "long_term", label: "Langfristige Zusammenarbeit" },
  { value: "other", label: "Sonstiges" },
];

interface CooperationFormProps {
  /** TikTok-Username falls von Creator-Detail-Seite gekommen. */
  initialCreator?: string;
}

interface CreatorContext {
  username: string;
  displayName?: string;
  profileId?: string;
}

export function CooperationForm({ initialCreator = "" }: CooperationFormProps) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    type: "live_campaign",
    message: "",
    budget: "",
    honeypot: "",
  });
  const [creator, setCreator] = useState<CreatorContext | null>(
    initialCreator ? { username: initialCreator.replace(/^@/, "") } : null,
  );

  // Wenn auf der Kooperationen-Seite ein Creator-Card-Button klickt,
  // sendet die Grid-Komponente ein CustomEvent. Wir fuellen Creator-
  // Context + scrollen ist schon dort uebernommen.
  useEffect(() => {
    function onPrefill(e: Event) {
      const ce = e as CustomEvent<{ tiktokUsername: string; displayName: string; profileId: string }>;
      const d = ce.detail;
      if (!d?.tiktokUsername) return;
      setCreator({
        username: d.tiktokUsername.replace(/^@/, ""),
        displayName: d.displayName,
        profileId: d.profileId,
      });
    }
    window.addEventListener("zoe:coop-prefill", onPrefill);
    return () => window.removeEventListener("zoe:coop-prefill", onPrefill);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = creator
      ? {
          ...form,
          creator_username: creator.username,
          creator_display_name: creator.displayName ?? null,
          creator_id: creator.profileId ?? null,
          creator_url: `${typeof window !== "undefined" ? window.location.origin : ""}/creator/${encodeURIComponent(creator.username)}`,
        }
      : form;

    const res = await fetch("/api/cooperation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Fehler beim Senden.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="border border-champagne/40 bg-champagne/5 p-8 md:p-12 text-center">
        <p className="eyebrow text-champagne mb-4">✓ Anfrage gesendet</p>
        <h3 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-4">
          Vielen Dank, {form.first_name}.
        </h3>
        <p className="text-cream/65 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
          Wir melden uns innerhalb von 24–48 Stunden mit einem konkreten Vorschlag.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {creator && (
        <div className="border border-champagne/30 bg-champagne/[0.04] p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-1">
              Anfrage fuer Creator
            </p>
            <p className="text-champagne font-display italic text-lg">
              {creator.displayName ? `${creator.displayName} ` : ""}
              <span className="text-cream/65 text-sm">@{creator.username}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreator(null)}
            className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em] shrink-0"
          >
            entfernen
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <Field label="Vorname" required>
          <input
            type="text"
            required
            value={form.first_name}
            onChange={(e) => update("first_name", e.target.value)}
            className="input-text"
          />
        </Field>
        <Field label="Nachname" required>
          <input
            type="text"
            required
            value={form.last_name}
            onChange={(e) => update("last_name", e.target.value)}
            className="input-text"
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <Field label="Firma" required>
          <input
            type="text"
            required
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            className="input-text"
          />
        </Field>
        <Field label="Position">
          <input
            type="text"
            value={form.position}
            onChange={(e) => update("position", e.target.value)}
            className="input-text"
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-5">
        <Field label="E-Mail" required>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="input-text"
          />
        </Field>
        <Field label="Telefon (optional)">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="input-text"
          />
        </Field>
      </div>

      <Field label="Art der Kooperation" required>
        <select
          required
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
          className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none transition"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Nachricht" required>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => update("message", e.target.value.slice(0, 4000))}
          placeholder="Briefing, Ideen, Zeitraum, Zielgruppe, Konkretes …"
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none transition resize-none"
        />
        <p className="text-cream/35 text-[10px] mt-1 text-right">{form.message.length}/4000</p>
      </Field>

      <Field label="Budget (optional)">
        <input
          type="text"
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
          placeholder="z.B. 5–10K, 25K+, je nach Skalierung"
          className="input-text"
        />
      </Field>

      {/* Honeypot — bots fill this */}
      <input
        type="text"
        name="company_role"
        tabIndex={-1}
        autoComplete="off"
        value={form.honeypot}
        onChange={(e) => update("honeypot", e.target.value)}
        className="hidden"
        aria-hidden
      />

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-cta btn-shimmer w-full md:w-auto disabled:opacity-50"
      >
        {loading ? "Sende…" : "Anfrage senden"}
        {!loading && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>

      <p className="text-cream/50 text-xs leading-relaxed">
        Antwort innerhalb von 24–48 Stunden. Anfragen gehen direkt an{" "}
        <a href="mailto:nesip.vural@zoe-star.de" className="text-champagne hover:underline">
          nesip.vural@zoe-star.de
        </a>
        . Direkter Creator-Kontakt nicht moeglich — alles laeuft ueber die Agency.
      </p>

      <style jsx>{`
        .input-text {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(201, 168, 106, 0.3);
          padding: 0.75rem 1rem;
          color: rgb(244, 241, 231);
          transition: border-color 0.3s;
        }
        .input-text::placeholder { color: rgba(244, 241, 231, 0.3); }
        .input-text:focus { outline: none; border-color: rgb(201, 168, 106); }
      `}</style>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-2">
        {label}{required && <span className="text-champagne ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
