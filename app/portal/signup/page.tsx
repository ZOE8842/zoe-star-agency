"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

function SignupForm() {
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get("invite") || "";

  const [form, setForm] = useState({
    invite: inviteFromUrl,
    email: "",
    password: "",
    passwordConfirm: "",
    tiktok_username: "",
    display_name: "",
    country: "DE",
    language: "de",
  });
  const [acceptDatenschutz, setAcceptDatenschutz] = useState(false);
  const [acceptAgb, setAcceptAgb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptDatenschutz || !acceptAgb) {
      setError("Bitte Datenschutz, AGB und Portal-Regeln akzeptieren.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    if (form.password.length < 12) {
      setError("Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }
    if (!form.tiktok_username.trim()) {
      setError("TikTok Username ist Pflicht.");
      return;
    }

    setLoading(true);

    // Tiktok-Username mit @ normalisieren
    const tiktokClean = form.tiktok_username.startsWith("@")
      ? form.tiktok_username.slice(1)
      : form.tiktok_username;

    const supabase = createClient();

    // 1. Auth-Account erstellen (sendet Verify-Mail, KEINE Session)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          tiktok_username: tiktokClean,
          display_name: form.display_name,
          invite_code: form.invite,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Account-Erstellung fehlgeschlagen.");
      setLoading(false);
      return;
    }

    // 2. Profile-Insert via Server-API (Service-Role bypasst RLS,
    //    weil signUp() bei aktivem Email-Confirm KEINE Session liefert)
    const res = await fetch("/api/signup-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: authData.user.id,
        email: form.email,
        invite_code: form.invite,
        tiktok_username: tiktokClean,
        display_name: form.display_name,
        country: form.country,
        language: form.language,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      setError(result.error || "Profile konnte nicht erstellt werden.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <>
      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="block mb-10 mx-auto w-fit stagger-1">
          <Logo variant="avatar" className="h-20 breathe" />
        </Link>

        <p className="eyebrow text-center mb-4 stagger-1">Creator-Anmeldung</p>

        <h1 className="heading-display text-cream text-4xl md:text-5xl text-center leading-[1.05] mb-4 stagger-2">
          Creator <span className="text-champagne italic">werden.</span>
        </h1>

        <p className="text-cream/60 text-center text-sm md:text-base mb-10 stagger-2">
          Du wurdest persönlich eingeladen. Lege deinen Zugang an.
        </p>

        {success ? (
          <div className="card-featured p-10 text-center space-y-6">
            <p className="eyebrow text-champagne">✓ Aufnahme bestätigt</p>
            <h2 className="font-display italic text-3xl md:text-4xl text-cream leading-tight">
              Bitte Email <span className="text-champagne">bestätigen.</span>
            </h2>
            <div className="hairline-divider w-24 mx-auto" />
            <p className="text-cream/65 text-sm md:text-base leading-relaxed italic font-display">
              Wir haben dir einen Bestätigungs-Link an<br />
              <span className="text-champagne font-mono text-xs not-italic">{form.email}</span><br />
              gesendet. Klicke den Link, um dein Konto zu aktivieren.
            </p>
            <p className="text-cream/40 text-xs leading-relaxed italic">
              Keine Mail im Posteingang? Prüfe deinen Spam-Ordner. Der Link ist 24 Stunden gültig.
            </p>
            <Link href="/portal/login" className="btn-editorial inline-flex mt-4">
              Zum Login <span aria-hidden>→</span>
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="eyebrow block mb-2">Invite Code</label>
            <input
              type="text"
              required
              value={form.invite}
              onChange={(e) => update("invite", e.target.value.toUpperCase())}
              className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none uppercase tracking-wider"
              placeholder="ZOE-2026-XXXXXX"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">TikTok Username</label>
            <div className="flex items-center border border-champagne/30 focus-within:border-champagne">
              <span className="px-3 text-champagne">@</span>
              <input
                type="text"
                required
                value={form.tiktok_username}
                onChange={(e) => update("tiktok_username", e.target.value.replace(/^@/, ""))}
                className="flex-1 bg-transparent py-3 pr-4 text-cream placeholder-cream/30 focus:outline-none"
                placeholder="yourusername"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-2">Display Name</label>
            <input
              type="text"
              required
              value={form.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
              placeholder="Your name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-2">Country</label>
              <select
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
              >
                <option value="DE">Germany</option>
                <option value="AT">Austria</option>
                <option value="CH">Switzerland</option>
                <option value="FR">France</option>
                <option value="TR">Türkiye</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-2">Language</label>
              <select
                value={form.language}
                onChange={(e) => update("language", e.target.value)}
                className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-2">Password</label>
            <input
              type="password"
              required
              minLength={12}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
              placeholder="Minimum 12 characters"
            />
            <p className="text-cream/40 text-xs mt-2">Use a unique password — NOT your TikTok password.</p>
          </div>

          <div>
            <label className="eyebrow block mb-2">Confirm Password</label>
            <input
              type="password"
              required
              value={form.passwordConfirm}
              onChange={(e) => update("passwordConfirm", e.target.value)}
              className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
              placeholder="Repeat your password"
            />
          </div>

          <div className="border border-champagne/20 bg-champagne/5 p-4 mt-2">
            <p className="text-champagne text-xs uppercase tracking-[0.2em] font-semibold mb-2">⚠ Sicherheits-Hinweis</p>
            <p className="text-cream/70 text-xs leading-relaxed">
              Bitte verwende NIE dein TikTok-Passwort. Wähle ein eigenes, einzigartiges Passwort nur für das ZOE-Portal.
            </p>
          </div>

          <div className="space-y-3 mt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" required checked={acceptDatenschutz}
                onChange={(e) => setAcceptDatenschutz(e.target.checked)}
                className="mt-1 w-4 h-4 accent-champagne shrink-0"
              />
              <span className="text-cream/70 text-xs leading-relaxed">
                Ich akzeptiere die{" "}
                <a href="/legal/datenschutz" target="_blank" className="text-champagne hover:underline">Datenschutzerklärung</a>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox" required checked={acceptAgb}
                onChange={(e) => setAcceptAgb(e.target.checked)}
                className="mt-1 w-4 h-4 accent-champagne shrink-0"
              />
              <span className="text-cream/70 text-xs leading-relaxed">
                Ich akzeptiere die{" "}
                <a href="/legal/agb" target="_blank" className="text-champagne hover:underline">AGB</a>{" "}
                und die{" "}
                <a href="/legal/portal-regeln" target="_blank" className="text-champagne hover:underline">Portal-Regeln</a>.
              </span>
            </label>
          </div>

          {error && (
            <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-cta w-full disabled:opacity-50">
            {loading ? "Creating account…" : "Account erstellen"}
            {!loading && <span className="btn-cta-arrow" aria-hidden>→</span>}
          </button>

          <p className="text-center text-cream/50 text-xs mt-6 italic font-display">
            Already have an account?{" "}
            <Link href="/portal/login" className="text-champagne hover:text-champagne-300 not-italic uppercase tracking-[0.2em] text-[10px]">Sign in →</Link>
          </p>
        </form>
        )}
      </div>
      </main>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-cream/40 text-sm">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
