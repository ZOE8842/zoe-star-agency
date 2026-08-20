"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/Logo";
import { authErrorText } from "@/lib/auth/error-messages";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    // Supabase setzt eine temporäre Session via Recovery-Token aus URL-Hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    if (password.length < 12) {
      setError("Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(authErrorText(err.message));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/portal");
      router.refresh();
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="block mb-12 mx-auto w-fit">
          <Logo variant="avatar" className="h-20" />
        </Link>

        <h1 className="heading-display text-cream text-3xl text-center mb-3">Reset password</h1>
        <p className="text-cream/60 text-sm text-center mb-10">
          Wähle ein neues, eigenständiges Passwort.
        </p>

        {validSession === false ? (
          <div className="border border-red-500/40 bg-red-500/10 p-6 text-center">
            <p className="eyebrow mb-3 text-red-300">Reset-Link ungültig</p>
            <p className="text-cream/70 text-sm leading-relaxed mb-6">
              Der Reset-Link ist abgelaufen oder ungültig. Bitte fordere einen neuen an.
            </p>
            <Link href="/portal/forgot-password" className="btn-outline">
              Neuen Link anfordern
            </Link>
          </div>
        ) : success ? (
          <div className="border border-champagne/30 bg-champagne/5 p-6 text-center">
            <p className="eyebrow mb-3 text-champagne">✓ Passwort gespeichert</p>
            <p className="text-cream/80 text-sm leading-relaxed">
              Du wirst gleich zum Dashboard weitergeleitet.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="eyebrow block mb-2">Neues Passwort</label>
              <input
                id="password"
                type="password"
                required
                minLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none transition"
                placeholder="Min. 12 Zeichen"
              />
              <p className="text-cream/40 text-xs mt-2">
                Eigenes Passwort · NICHT identisch mit TikTok.
              </p>
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="eyebrow block mb-2">Bestätigen</label>
              <input
                id="passwordConfirm"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none transition"
                placeholder="Passwort wiederholen"
              />
            </div>

            {error && (
              <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Speichere..." : "Passwort speichern"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
