"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function generateCode() {
  const year = new Date().getFullYear();
  const rand = Array.from({ length: 6 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
  return `ZOE-${year}-${rand}`;
}

type Mode = "send" | "code_only";

interface SuccessState {
  code: string;
  signupUrl: string;
  mailed: boolean;
  recipient?: string;
}

export function InviteGenerator({ adminId }: { adminId: string }) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("send");
  const [code, setCode] = useState(generateCode());
  const [role, setRole] = useState<"creator" | "manager">("creator");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  function reset() {
    setSuccess(null);
    setEmail("");
    setRecipientName("");
    setPersonalNote("");
    setCode(generateCode());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const expires_at = expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 3600 * 1000).toISOString()
      : null;

    const supabase = createClient();

    if (mode === "send") {
      // Code + Mail in einem Schritt via Admin-API
      const res = await fetch("/api/admin/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          intended_role: role,
          expires_in_days: expiresInDays,
          recipient_name: recipientName.trim() || undefined,
          personal_note: personalNote.trim() || undefined,
          code,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Mail-Versand fehlgeschlagen.");
        setLoading(false);
        return;
      }
      // DB-Verify: Code MUSS jetzt in invites stehen, sonst Fail.
      const verify = await supabase
        .from("invites")
        .select("code")
        .eq("code", json.code)
        .maybeSingle();
      if (!verify.data) {
        setError(`Code ${json.code} wurde NICHT in der DB gefunden. Bitte erneut versuchen oder Admin pruefen.`);
        setLoading(false);
        return;
      }
      setSuccess({
        code: json.code,
        signupUrl: json.signup_url,
        mailed: true,
        recipient: email.trim(),
      });
    } else {
      // Code-only via direktem Supabase-Insert
      const { error: err } = await supabase.from("invites").insert({
        code, created_by: adminId, intended_role: role, expires_at,
      });
      if (err) {
        setError(`Insert fehlgeschlagen: ${err.message}`);
        setLoading(false);
        return;
      }
      // DB-Verify
      const verify = await supabase
        .from("invites")
        .select("code")
        .eq("code", code)
        .maybeSingle();
      if (!verify.data) {
        setError(`Code ${code} wurde NICHT in der DB gefunden trotz Insert ok. Bitte erneut versuchen.`);
        setLoading(false);
        return;
      }
      setSuccess({
        code,
        signupUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/portal/signup?invite=${code}`,
        mailed: false,
      });
    }

    setLoading(false);
    setCode(generateCode());
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="eyebrow">Create invite</p>
        <div className="flex gap-2 text-[10px] uppercase tracking-[0.2em]">
          <button
            type="button"
            onClick={() => setMode("send")}
            className={`px-3 py-1.5 border ${mode === "send" ? "border-champagne text-champagne" : "border-champagne/20 text-cream/40 hover:text-cream/70"}`}
          >
            Code + Mail
          </button>
          <button
            type="button"
            onClick={() => setMode("code_only")}
            className={`px-3 py-1.5 border ${mode === "code_only" ? "border-champagne text-champagne" : "border-champagne/20 text-cream/40 hover:text-cream/70"}`}
          >
            Code only
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Code</label>
          <div className="flex gap-2">
            <input
              type="text" required value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 bg-transparent border border-champagne/30 px-3 py-2 text-cream font-mono text-base focus:border-champagne focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setCode(generateCode())}
              className="px-3 py-2 border border-champagne/30 text-champagne text-[10px] uppercase tracking-[0.2em] hover:border-champagne"
            >
              ↻
            </button>
          </div>
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Role</label>
          <select
            value={role} onChange={(e) => setRole(e.target.value as "creator" | "manager")}
            className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream text-base focus:border-champagne focus:outline-none"
          >
            <option value="creator">Creator</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Expires in (days, 0 = never)</label>
          <input
            type="number" min={0} max={365} value={expiresInDays}
            onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream text-base focus:border-champagne focus:outline-none"
          />
        </div>
      </div>

      {mode === "send" && (
        <div className="space-y-4 mb-5 pt-5 border-t border-champagne/10">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Empfaenger Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@email.com"
                className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream text-base focus:border-champagne focus:outline-none"
              />
            </div>
            <div>
              <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Name (optional)</label>
              <input
                type="text" value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Vorname"
                className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream text-base focus:border-champagne focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">
              Persoenliche Notiz (optional, max 800)
            </label>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value.slice(0, 800))}
              rows={3}
              placeholder="Wir haben deine Stimme bei TikTok gesehen und wollen dich persoenlich einladen."
              className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream text-sm focus:border-champagne focus:outline-none italic"
            />
            <p className="text-cream/30 text-[10px] mt-1 text-right">{personalNote.length}/800</p>
          </div>
        </div>
      )}

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm mb-4">{error}</div>}
      {success && (
        <div className="border border-green-500/40 bg-green-500/5 px-4 py-3 mb-4 space-y-1.5">
          <p className="text-green-300 text-sm font-medium">
            ✓ Code in DB gespeichert + verifiziert.
          </p>
          <p className="text-cream/70 text-sm">
            {success.mailed
              ? <>Mail an <span className="font-mono text-champagne">{success.recipient}</span> versendet.</>
              : <>Code <span className="font-mono text-champagne">{success.code}</span> bereit zum Verschicken.</>}
          </p>
          <p className="text-cream/50 text-xs">
            Code: <span className="font-mono text-cream/80">{success.code}</span>
          </p>
          <p className="text-cream/50 text-xs">
            Signup-Link: <span className="font-mono text-cream/80 break-all">{success.signupUrl}</span>
          </p>
          <button
            type="button"
            onClick={reset}
            className="text-champagne text-[10px] uppercase tracking-[0.2em] mt-2 hover:underline"
          >
            ↻ Naechster Invite
          </button>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading
          ? (mode === "send" ? "Sende..." : "Erstelle...")
          : (mode === "send" ? "Code erstellen + Mail senden" : "Code erstellen")}
      </button>
    </form>
  );
}
