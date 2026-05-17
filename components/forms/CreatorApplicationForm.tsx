"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

// Client-side normalisierung (matched Server-Logik):
// strips fuehrende @, trim, validate gegen [A-Za-z0-9._-]
function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}
const USERNAME_RE = /^[A-Za-z0-9._-]{2,63}$/;

export function CreatorApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [method, setMethod] = useState<"tiktok" | "telegram">("tiktok");
  const [username, setUsername] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");

  function validateUsername(raw: string): string | null {
    const u = normalizeUsername(raw);
    if (!u) return "Bitte gib deinen TikTok Username ein.";
    if (!USERNAME_RE.test(u)) {
      return "Nur Buchstaben, Zahlen, Punkt, Unterstrich, Bindestrich (2-63 Zeichen).";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    // Client-side Pre-Check fuer schnelles Feedback
    const usernameErr = validateUsername(username);
    if (usernameErr) {
      setUsernameError(usernameErr);
      setStatus("error");
      setErrorMsg(usernameErr);
      return;
    }
    setUsernameError("");

    setStatus("submitting");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const payload = {
      // Username schicken wir normalisiert (Server normalisiert nochmals)
      tiktok_username: normalizeUsername(username),
      tiktok_profile_url: String(fd.get("tiktok_profile_url") || "").trim(),
      tiktok_display_name: String(fd.get("tiktok_display_name") || "").trim(),
      contact_method: String(fd.get("contact_method") || "tiktok"),
      telegram_username: String(fd.get("telegram_username") || "").trim().replace(/^@+/, ""),
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
    <form onSubmit={onSubmit} className="border border-champagne/15 p-7 md:p-10 max-w-3xl mx-auto grid gap-6" noValidate>
      {/* Honeypot - hidden from real users */}
      <div className="hidden" aria-hidden>
        <label>Firma <input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* TikTok Username mit @ als Prefix */}
        <div>
          <label htmlFor="tiktok_username" className="block text-cream/70 text-xs uppercase tracking-[0.2em] mb-2">
            TikTok Username *
          </label>
          <div className={`flex items-stretch border ${usernameError ? "border-red-400/60" : "border-champagne/15 focus-within:border-champagne/50"} transition-colors`}>
            <span className="px-3 py-3 text-champagne/70 font-display italic select-none border-r border-champagne/15 bg-champagne/[0.03]" aria-hidden>
              @
            </span>
            <input
              id="tiktok_username"
              name="tiktok_username_visible"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (usernameError) setUsernameError("");
              }}
              onBlur={(e) => {
                // Visual normalize on blur: strip leading @
                const norm = normalizeUsername(e.target.value);
                if (norm !== e.target.value) setUsername(norm);
              }}
              placeholder="deinusername"
              autoComplete="off"
              inputMode="text"
              maxLength={70}
              className="flex-1 bg-transparent px-4 py-3 text-cream placeholder-cream/30 focus:outline-none"
            />
          </div>
          {usernameError && (
            <p className="text-red-400 text-xs mt-1.5" role="alert">{usernameError}</p>
          )}
        </div>

        <FormField label="Anzeigename" name="tiktok_display_name"
          placeholder="z.B. Dein Stage-Name (Emojis ok)" autoComplete="name" maxLength={120} />
      </div>

      <FormField label="TikTok Profil-Link (optional)" name="tiktok_profile_url"
        placeholder="https://www.tiktok.com/@username" inputMode="url" maxLength={300}
        hint="Optional. Wenn leer, bauen wir den Link automatisch aus deinem Username." />

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
            placeholder="@deintelegram" autoComplete="off" maxLength={64}
            hint="Mit oder ohne @ - wir normalisieren das." />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <FormField label="Sprache (optional)" name="language"
          placeholder="z.B. Deutsch, Englisch" maxLength={32} />
        <FormField label="Region (optional)" name="region"
          placeholder="z.B. Berlin, DACH" maxLength={64} />
      </div>

      <div>
        <label htmlFor="message" className="block text-cream/70 text-xs uppercase tracking-[0.2em] mb-2">
          Kurze Nachricht <span className="text-cream/40 normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={1500}
          placeholder="Was sollen wir wissen? Style, LIVE-Erfahrung, Ziele … Emojis sind ok."
          className="w-full bg-transparent border border-champagne/15 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne/50 focus:outline-none transition-colors"
        />
      </div>

      <label className="flex items-start gap-3 text-cream/70 text-sm cursor-pointer">
        <input type="checkbox" name="consent_privacy"
          className="mt-1 accent-champagne shrink-0" />
        <span>
          Ich stimme zu, dass ZOE Star Agency meine Angaben zur Prüfung meiner Anfrage speichert.
          Keine Weitergabe an Dritte. <a href="/legal/datenschutz" className="text-champagne underline">Datenschutz</a>.
        </span>
      </label>

      {status === "error" && errorMsg && !usernameError && (
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
  hint?: string;
}

function FormField({ label, name, required, hint, ...rest }: FormFieldProps) {
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
      {hint && <p className="text-cream/40 text-xs mt-1.5">{hint}</p>}
    </div>
  );
}
