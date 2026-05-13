"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

// Whitelist: nur relative Portal-Pfade akzeptieren. URL-Normalisierung
// fängt zusätzlich Path-Traversal (/portal/../external) und Null-Bytes ab.
// Dummy-Base statt window.location.origin, damit der Helper auch ausserhalb
// des Browser-Contexts safe ist.
function safeRedirect(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/portal";
  if (raw.includes("\0") || raw.startsWith("//") || raw.startsWith("\\")) {
    return "/portal";
  }
  try {
    const u = new URL(raw, "https://internal.invalid");
    if (u.origin !== "https://internal.invalid") return "/portal";
    if (u.pathname !== "/portal" && !u.pathname.startsWith("/portal/")) {
      return "/portal";
    }
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return "/portal";
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="stagger-3">
        <label htmlFor="email" className="block text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none transition"
          placeholder="you@email.com"
          autoComplete="email"
        />
      </div>

      <div className="stagger-4">
        <label htmlFor="password" className="block text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-2">
          Passwort
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none transition"
          placeholder="Dein Portal-Passwort"
          autoComplete="current-password"
        />
        <p className="text-cream/40 text-xs mt-2">
          Nutze dein persönliches ZOE-Portal-Passwort.
        </p>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-cta w-full disabled:opacity-50 stagger-5"
      >
        {loading ? "Einloggen…" : "Einloggen"}
        {!loading && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>
    </form>
  );
}

const FEATURES = [
  "Creator Services",
  "Creator-Inbox",
  "Event-System",
  "Analytics",
  "Management",
];

export default function LoginPage() {
  return (
    <>
      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          <Link href="/" className="block mb-10 mx-auto w-fit stagger-1">
            <Logo variant="avatar" className="h-24 md:h-24 breathe" />
          </Link>

          <p className="eyebrow text-center mb-4 stagger-1">Login</p>

          <h1 className="heading-display text-cream text-4xl md:text-5xl text-center leading-[1.05] mb-4 stagger-2">
            Willkommen <span className="text-champagne italic">zurück.</span>
          </h1>

          <p className="text-cream/60 text-center text-sm md:text-base mb-10 stagger-2">
            Zugang zum TikTok LIVE Creator Portal.
          </p>

          <Suspense fallback={<div className="text-cream/40 text-sm text-center">Lade…</div>}>
            <LoginForm />
          </Suspense>

          {/* Sub-Links — kompakter, sekundärer */}
          <div className="flex justify-between items-center mt-10 text-xs">
            <Link
              href="/portal/forgot-password"
              className="text-cream/45 hover:text-champagne transition-colors text-[11px]"
            >
              Passwort vergessen?
            </Link>
            <Link
              href="/portal/signup"
              className="text-champagne hover:text-champagne-300 transition-colors uppercase tracking-[0.2em] text-[10px]"
            >
              Creator-Zugang aktivieren →
            </Link>
          </div>

          {/* Feature-Leiste — was kann das Portal */}
          <div className="mt-14 pt-8 border-t border-champagne/10">
            <p className="eyebrow text-center mb-5">Im Portal</p>
            <ul className="flex flex-wrap justify-center gap-x-3 gap-y-2 text-cream/55 text-[11px]">
              {FEATURES.map((f, i) => (
                <li key={f} className="inline-flex items-center gap-2">
                  <span className="text-champagne/60">✓</span>
                  <span>{f}</span>
                  {i < FEATURES.length - 1 && (
                    <span className="text-champagne/25 ml-1" aria-hidden>·</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Status-Marker — keine Phase, klare Identität */}
          <p className="text-cream/40 text-[10px] uppercase tracking-[0.3em] text-center mt-10">
            TikTok Elite Agency Club Deutschland
          </p>

          <Link
            href="/"
            className="block text-center mt-8 text-cream/35 text-[10px] uppercase tracking-[0.3em] hover:text-champagne transition-colors"
          >
            ← Zur Website
          </Link>
        </div>
      </main>
    </>
  );
}
