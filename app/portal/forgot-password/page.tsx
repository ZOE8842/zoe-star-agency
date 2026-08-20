"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { authErrorText } from "@/lib/auth/error-messages";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/portal/reset-password`,
    });

    if (err) {
      setError(authErrorText(err.message));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="block mb-12 mx-auto w-fit">
          <Logo variant="avatar" className="h-20" />
        </Link>

        <h1 className="heading-display text-cream text-3xl text-center mb-3">Forgot password?</h1>
        <p className="text-cream/60 text-sm text-center mb-10">
          Enter your email · we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div className="border border-champagne/30 bg-champagne/5 p-6 text-center">
            <p className="eyebrow mb-3 text-champagne">✓ Email sent</p>
            <p className="text-cream/80 text-sm leading-relaxed">
              Wenn ein Account mit dieser Email existiert, haben wir dir einen Reset-Link geschickt.
              Bitte prüfe deinen Posteingang (auch Spam-Ordner).
            </p>
          </div>
        ) : (
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

            {error && (
              <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="flex justify-center mt-8 text-xs">
          <Link href="/portal/login" className="text-cream/60 hover:text-champagne">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
