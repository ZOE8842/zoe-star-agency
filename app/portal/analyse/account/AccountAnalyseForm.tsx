"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestAccountAnalysis } from "./actions";

interface Props {
  defaultUsername: string;
  hasOpenAnalysis: boolean;
}

export function AccountAnalyseForm({ defaultUsername, hasOpenAnalysis }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasOpenAnalysis) {
    return (
      <div className="border border-champagne/15 p-5 md:p-7">
        <p className="eyebrow text-champagne mb-3">Eine Analyse laeuft bereits</p>
        <p className="text-cream/65 text-sm md:text-base leading-relaxed">
          Du hast bereits eine offene Account-Analyse. Sobald sie fertig ist,
          kannst du eine neue starten. Ergebnis erscheint hier + im Activity-Feed
          deiner Inbox.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const r = await requestAccountAnalysis({
      target_tiktok_username: username,
      manual_note: note || undefined,
    });
    setSubmitting(false);
    if (!r.ok) { setError(r.error || "Konnte nicht starten."); return; }
    router.push(`/portal/analyse/account/${r.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-5 md:p-7 space-y-6">
      <div>
        <label className="eyebrow block mb-2">TikTok Username</label>
        <div className="flex items-center border-b border-champagne/20 focus-within:border-champagne transition-colors">
          <span className="text-champagne/60 text-base md:text-lg pr-1 select-none">@</span>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/^@+/, ""))}
            placeholder="deinhandle"
            className="w-full bg-transparent text-cream text-base md:text-lg py-3 placeholder-cream/25 focus:outline-none"
          />
        </div>
        <p className="text-cream/35 text-xs mt-2">
          Default ist dein Profil. Du kannst auch ein anderes Profil analysieren lassen.
        </p>
      </div>

      <div>
        <label className="eyebrow block mb-2">Worauf besonders schauen? (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          maxLength={500}
          placeholder="z.B. Bio kommt nicht an, Profilbild zu unscharf, Hook fuer LIVE schwach"
          className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-champagne/70 text-xs italic">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !username.trim()}
        className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Starte…" : "Analyse starten"}
        {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>
    </form>
  );
}
