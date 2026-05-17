"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function CreatorApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [method, setMethod] = useState<"tiktok" | "telegram">("tiktok");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      tiktok_username: String(fd.get("tiktok_username") || "").trim(),
      tiktok_profile_url: String(fd.get("tiktok_profile_url") || "").trim(),
      tiktok_display_name: String(fd.get("tiktok_display_name") || "").trim(),
      contact_method: String(fd.get("contact_method") || "tiktok"),
      telegram_username: String(fd.get("telegram_username") || "").trim(),
      language: String(fd.get("language") || "").trim(),
      region: String(fd.get("region") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      consent_privacy: fd.get("consent_privacy") === "on",
      company: String(fd.get("company") || ""),
    };

    try {
      const r = await fetch("/api/creator-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("error");
        setErrorMsg(j?.error || "Anfrage fehlgeschlagen. Bitte spaeter erneut versuchen.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Netzwerk-Fehler. Bitte spaeter erneut versuchen.");
    }
  }

  if (status === "success") {
    return (
      <div className="border border-champagne/30 bg-champagne/5 p-8 md:p-12 text-center max-w-3xl mx-auto">
        <p className="eyebrow mb-4 text-champagne">Anfrage eingegangen</p>
        <h3 className="font-display italic text-2xl md:text-3xl text-cream mb-4 leading-tight">
          Danke. Wir prüfen dein Profil.
        </h3>
        <p className="text-cream/70 text-sm md:text-base max-w-xl mx-auto">
          Wir melden uns über TikTok oder Telegram. Innerhalb 1–3 Werktagen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border border-champagne/15 p-7 md:p-10 max-w-3xl mx-auto grid gap-6">
      {/* Honeypot - hidden from real users */}
      <div className="hidden" aria-hidden>
        <label>Firma <input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <FormField label="TikTok Username *" name="tiktok_username" required
          placeholder="@deinusername" autoComplete="off" />
        <FormField label="Anzeigename" name="tiktok_display_name"
          placeholder="z.B. Dein Stage-Name" autoComplete="name" />
      </div>

      <FormField label="TikTok Profil-Link" name="tiktok_profile_url"
        placeholder="https://www.tiktok.com/@username" inputMode="url" />

      <div className="grid gap-3">
        <p className="text-cream/70 text-xs uppercase tracking-[0.2em]">Wie sollen wir dich kontaktieren? *</p>
        <div className="grid grid-cols-2 gap-3">
          <label className={`border ${method === "tiktok" ? "border-champagne bg-champagne/5" : "border-champagne/15"} p-4 cursor-pointer transition-colors`}>
            <input type="radio" name="contact_method" value="tiktok"
              checked={method === "tiktok"} onChange={() => setMethod("tiktok")}
              className="sr-only" />
            <span className="text-cream font-display italic text-lg">TikTok DM</span>
            <p className="text-cream/50 text-xs mt-1">Direkt auf deiner Profilseite</p>
          </label>
          <label className={`border ${method === "telegram" ? "border-champagne bg-champagne/5" : "border-champagne/15"} p-4 cursor-pointer transition-colors`}>
            <input type="radio" name="contact_method" value="telegram"
              checked={method === "telegram"} onChange={() => setMethod("telegram")}
              className="sr-only" />
            <span className="text-cream font-display italic text-lg">Telegram</span>
            <p className="text-cream/50 text-xs mt-1">Schnellere Antwort</p>
          </label>
        </div>
        {method === "telegram" && (
          <FormField label="Telegram Username *" name="telegram_username" required
            placeholder="@deintelegram" autoComplete="off" />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <FormField label="Sprache" name="language" placeholder="z.B. Deutsch, Englisch" />
        <FormField label="Region" name="region" placeholder="z.B. Berlin, DACH" />
      </div>

      <div>
        <label className="block text-cream/70 text-xs uppercase tracking-[0.2em] mb-2">
          Kurze Nachricht <span className="text-cream/40 normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          name="message"
          rows={4}
          maxLength={1500}
          placeholder="Was sollen wir wissen? Style, LIVE-Erfahrung, Ziele …"
          className="w-full bg-transparent border border-champagne/15 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne/50 focus:outline-none transition-colors"
        />
      </div>

      <label className="flex items-start gap-3 text-cream/70 text-sm cursor-pointer">
        <input type="checkbox" name="consent_privacy" required
          className="mt-1 accent-champagne shrink-0" />
        <span>
          Ich stimme zu, dass ZOE Star Agency meine Angaben zur Prüfung meiner Anfrage speichert.
          Keine Weitergabe an Dritte. <a href="/legal/privacy" className="text-champagne underline">Datenschutz</a>.
        </span>
      </label>

      {status === "error" && (
        <p className="text-red-400 text-sm" role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Sende …" : "Als Creator anfragen"}
      </button>
    </form>
  );
}

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}

function FormField({ label, name, required, ...rest }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-cream/70 text-xs uppercase tracking-[0.2em] mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="w-full bg-transparent border border-champagne/15 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne/50 focus:outline-none transition-colors"
        {...rest}
      />
    </div>
  );
}
