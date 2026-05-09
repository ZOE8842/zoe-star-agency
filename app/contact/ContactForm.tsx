"use client";

import { useState } from "react";

const TOPICS = [
  { value: "creator", label: "Creator-Bewerbung" },
  { value: "brand", label: "Brand-Kooperation" },
  { value: "event", label: "Event / Kampagne" },
  { value: "management", label: "Management-Anfrage" },
  { value: "other", label: "Allgemeine Anfrage" },
];

const ROLES = [
  { value: "creator", label: "Creator" },
  { value: "brand", label: "Marke" },
  { value: "agency", label: "Agentur" },
  { value: "management", label: "Management" },
  { value: "other", label: "Sonstiges" },
];

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    tiktok: "",
    role: "creator",
    topic: "creator",
    message: "",
    company: "", // Honeypot — bleibt leer
  });
  const [accept, setAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accept) {
      setError("Bitte Datenschutzerklärung akzeptieren.");
      return;
    }
    if (form.message.trim().length < 10) {
      setError("Nachricht zu kurz (min. 10 Zeichen).");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Senden fehlgeschlagen. Bitte später erneut versuchen.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="border border-champagne/30 bg-champagne/5 p-8 text-center">
        <p className="eyebrow mb-3 text-champagne">✓ Nachricht gesendet</p>
        <h2 className="font-display italic text-2xl text-cream mb-3">
          Danke für deine Nachricht.
        </h2>
        <p className="text-cream/70 text-sm leading-relaxed">
          Wir melden uns meist innerhalb von 24–48 Stunden unter <strong>{form.email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Honeypot — versteckt fuer User, sichtbar fuer Bots */}
      <div className="hidden" aria-hidden="true">
        <label>
          Firma
          <input
            type="text"
            name="company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="eyebrow block mb-2">Name</label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none text-base"
            placeholder="Vor- und Nachname"
          />
        </div>
        <div>
          <label htmlFor="email" className="eyebrow block mb-2">Email</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none text-base"
            placeholder="du@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="tiktok" className="eyebrow block mb-2">TikTok-Username (optional)</label>
        <div className="flex items-center border border-champagne/30 focus-within:border-champagne">
          <span className="px-3 text-champagne">@</span>
          <input
            id="tiktok"
            type="text"
            value={form.tiktok}
            onChange={(e) => setForm({ ...form, tiktok: e.target.value.replace(/^@/, "") })}
            className="flex-1 bg-transparent py-3 pr-4 text-cream placeholder-cream/30 focus:outline-none text-base"
            placeholder="username"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className="eyebrow block mb-2">Ich bin</label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none text-base"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="topic" className="eyebrow block mb-2">Anliegen</label>
          <select
            id="topic"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none text-base"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="eyebrow block mb-2">Nachricht</label>
        <textarea
          id="message"
          required
          rows={6}
          maxLength={2000}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none resize-none text-base"
          placeholder="Worum geht es?"
        />
        <p className="text-cream/40 text-xs mt-2 text-right">{form.message.length}/2000</p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
          className="mt-1 w-4 h-4 accent-champagne shrink-0"
        />
        <span className="text-cream/70 text-xs leading-relaxed">
          Ich akzeptiere die{" "}
          <a href="/legal/datenschutz" target="_blank" className="text-champagne hover:underline">
            Datenschutzerklärung
          </a>
          . Meine Daten werden ausschließlich zur Bearbeitung meiner Anfrage verwendet.
        </span>
      </label>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? "Sende…" : "Nachricht senden"}
      </button>
    </form>
  );
}
