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

export function InviteGenerator({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [code, setCode] = useState(generateCode());
  const [role, setRole] = useState<"creator" | "manager">("creator");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);

    const supabase = createClient();
    const expires_at = expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 3600 * 1000).toISOString()
      : null;

    const { error: err } = await supabase.from("invites").insert({
      code, created_by: adminId, intended_role: role, expires_at,
    });

    if (err) { setError(err.message); setLoading(false); return; }

    setCreated(code);
    setCode(generateCode());
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8">
      <p className="eyebrow mb-5">Create invite</p>

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

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm mb-4">{error}</div>}
      {created && (
        <div className="border border-green-500/40 bg-green-500/10 px-4 py-3 mb-4">
          <p className="text-green-300 text-sm">Invite-Code <span className="font-mono">{created}</span> erstellt.</p>
          <p className="text-cream/50 text-xs mt-1">
            Signup-Link: <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}/portal/signup?invite={created}</span>
          </p>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Creating..." : "Create invite"}
      </button>
    </form>
  );
}
