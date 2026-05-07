"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="eyebrow block mb-2">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none transition"
          placeholder="you@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="eyebrow block mb-2">Password</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none transition"
          placeholder="Your portal password"
        />
        <p className="text-cream/40 text-xs mt-2">Not your TikTok password — your dedicated ZOE portal password.</p>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="block mb-14 mx-auto w-fit">
          <Logo variant="avatar" className="h-20" />
        </Link>

        <p className="eyebrow text-center mb-4">Portal · Login</p>
        <h1 className="heading-display text-cream text-4xl md:text-5xl text-center leading-[1.05] mb-4">
          Welcome <span className="text-champagne">back.</span>
        </h1>
        <div className="hairline mx-auto mb-6" />
        <p className="text-cream/55 text-sm text-center mb-12 italic font-display">
          Sign in to the ZOE creator portal.
        </p>

        <Suspense fallback={<div className="text-cream/40 text-sm text-center">Loading…</div>}>
          <LoginForm />
        </Suspense>

        <div className="flex justify-between mt-10 text-xs">
          <Link href="/portal/forgot-password" className="text-cream/60 hover:text-champagne transition-colors">Forgot password?</Link>
          <Link href="/portal/signup" className="text-champagne hover:text-champagne-300 transition-colors">Have an invite? Sign up →</Link>
        </div>

        <Link href="/" className="block text-center mt-14 text-cream/40 text-[10px] uppercase tracking-[0.3em] hover:text-champagne transition-colors">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
