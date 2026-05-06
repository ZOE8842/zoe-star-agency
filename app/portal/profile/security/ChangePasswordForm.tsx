"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-Side Validierung
    if (newPw.length < 12) {
      setError("Neues Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }
    if (newPw !== newPwConfirm) {
      setError("Neue Passwörter stimmen nicht überein.");
      return;
    }
    if (newPw === currentPw) {
      setError("Neues Passwort darf nicht identisch mit dem alten sein.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Re-Auth via signInWithPassword (verifiziert aktuelles Passwort)
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email,
      password: currentPw,
    });

    if (reauthErr) {
      setError("Aktuelles Passwort ist nicht korrekt.");
      setLoading(false);
      return;
    }

    // Passwort ändern
    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPw,
    });

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setCurrentPw("");
    setNewPw("");
    setNewPwConfirm("");

    // Nach 3s Refresh um Session zu validieren
    setTimeout(() => router.refresh(), 3000);
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-6 md:p-8 space-y-5">
      <div>
        <label htmlFor="currentPw" className="eyebrow block mb-2">
          Aktuelles Passwort
        </label>
        <input
          id="currentPw"
          type="password"
          required
          autoComplete="current-password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none text-base"
          placeholder="Dein aktuelles Passwort"
        />
      </div>

      <div className="border-t border-champagne/10 pt-5">
        <label htmlFor="newPw" className="eyebrow block mb-2">
          Neues Passwort
        </label>
        <input
          id="newPw"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none text-base"
          placeholder="Mindestens 12 Zeichen"
        />
        <p className="text-cream/40 text-xs mt-2">
          Empfehlung: 16+ Zeichen, einmalig, nur fürs ZOE-Portal.
        </p>
      </div>

      <div>
        <label htmlFor="newPwConfirm" className="eyebrow block mb-2">
          Neues Passwort bestätigen
        </label>
        <input
          id="newPwConfirm"
          type="password"
          required
          autoComplete="new-password"
          value={newPwConfirm}
          onChange={(e) => setNewPwConfirm(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none text-base"
          placeholder="Neues Passwort wiederholen"
        />
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="border border-champagne/40 bg-champagne/10 px-4 py-3 text-champagne text-sm">
          ✓ Passwort erfolgreich geändert. Du bleibst eingeloggt.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? "Speichere..." : "Passwort ändern"}
      </button>
    </form>
  );
}
