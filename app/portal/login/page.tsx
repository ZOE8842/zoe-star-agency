"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

function editionMarker(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = String(d.getFullYear()).slice(-2);
  return `Edit. ${m}/${y}`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/portal";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="stagger-3">
        <label htmlFor="email" className="block text-cream/55 text-[10px] uppercase tracking-[0.3em] mb-3 italic font-display">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-editorial"
          placeholder="you@email.com"
          autoComplete="email"
        />
      </div>

      <div className="stagger-4">
        <label htmlFor="password" className="block text-cream/55 text-[10px] uppercase tracking-[0.3em] mb-3 italic font-display">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-editorial"
          placeholder="dein portal-passwort"
          autoComplete="current-password"
        />
        <p className="text-cream/35 text-xs mt-3 italic">
          Nicht dein TikTok-Passwort — dein dediziertes ZOE-Portal-Passwort.
        </p>
      </div>

      {error && (
        <div className="border-l-2 border-red-500/50 pl-4 py-2 text-red-300 text-sm italic">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-editorial w-full disabled:opacity-50 stagger-5"
      >
        {loading ? "Sign in…" : "Sign in"}
        {!loading && <span aria-hidden>→</span>}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <>
      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />
      <div className="atelier-vignette" />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">

          {/* Logo */}
          <Link href="/" className="block mb-12 mx-auto w-fit stagger-1">
            <Logo variant="avatar" className="h-24 breathe" />
          </Link>

          {/* Edition-Marker */}
          <p className="volume-marker text-center text-xs tracking-[0.3em] mb-6 stagger-1">
            {editionMarker()} · Portal
          </p>

          {/* Hero */}
          <h1 className="heading-display text-cream text-5xl md:text-6xl text-center leading-[1.0] mb-6 stagger-2">
            Welcome <span className="text-champagne italic">back.</span>
          </h1>

          <div className="hairline-divider w-32 mx-auto mb-6 stagger-2" />

          <p className="text-cream/60 text-center text-base md:text-lg italic font-display mb-14 stagger-2">
            Eine geschlossene Korrespondenz.
          </p>

          {/* Form */}
          <Suspense fallback={<div className="text-cream/40 text-sm text-center italic">Lade…</div>}>
            <LoginForm />
          </Suspense>

          {/* Sub-Links */}
          <div className="flex justify-between items-center mt-10 text-xs">
            <Link
              href="/portal/forgot-password"
              className="text-cream/55 hover:text-champagne transition-colors italic font-display"
            >
              Passwort vergessen?
            </Link>
            <Link
              href="/portal/signup"
              className="text-champagne hover:text-champagne-300 transition-colors uppercase tracking-[0.2em] text-[10px]"
            >
              Invite einlösen →
            </Link>
          </div>

          <Link
            href="/"
            className="block text-center mt-16 text-cream/35 text-[10px] uppercase tracking-[0.35em] hover:text-champagne transition-colors"
          >
            ← Zurück zur Site
          </Link>
        </div>
      </main>
    </>
  );
}
