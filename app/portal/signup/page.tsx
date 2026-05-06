"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

function SignupForm() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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

    // 1. Auth-Account erstellen
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

    // 2. Profile-Insert (RPC ruft Server-Function die Invite validiert + Profile anlegt)
    const { error: profileError } = await supabase.rpc("redeem_invite_and_create_profile", {
      invite_code_input: form.invite,
      tiktok_username_input: tiktokClean,
      display_name_input: form.display_name,
      country_input: form.country,
      language_input: form.language,
    });

    if (profileError) {
      setError(`Profile konnte nicht erstellt werden: ${profileError.message}`);
      setLoading(false);
      return;
    }

    router.push("/portal");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="block mb-12 mx-auto w-fit">
          <Logo variant="avatar" className="h-20" />
        </Link>

        <h1 className="heading-display text-cream text-3xl text-center mb-3">Create your account</h1>
        <p className="text-cream/60 text-sm text-center mb-10">Invite-only access to the ZOE creator portal</p>

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

          {error && (
            <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-cream/50 text-xs mt-6">
            Already have an account?{" "}
            <Link href="/portal/login" className="text-champagne hover:text-champagne-300">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-cream/40 text-sm">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
