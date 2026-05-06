"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = ["event", "traffic", "contract", "payout", "rule", "support", "general"] as const;

export function BroadcastForm({ senderId }: { senderId: string }) {
  const router = useRouter();
  const [target, setTarget] = useState<"all_creators" | "single">("all_creators");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [category, setCategory] = useState<typeof categories[number]>("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);

    const supabase = createClient();
    const payload: any = {
      sender_id: senderId,
      subject, body, category,
      requires_ack: requiresAck,
    };

    if (target === "all_creators") {
      payload.recipient_group = "all_creators";
    } else {
      // Recipient via Email-Lookup
      const { data: recipient } = await supabase
        .from("profiles").select("id").eq("email", recipientEmail).single();
      if (!recipient) {
        setError(`Kein User mit Email ${recipientEmail} gefunden.`);
        setLoading(false);
        return;
      }
      payload.recipient_id = recipient.id;
    }

    const { error: err } = await supabase.from("messages").insert(payload);

    if (err) { setError(err.message); setLoading(false); return; }

    setSubject(""); setBody(""); setRecipientEmail(""); setRequiresAck(false);
    setSuccess(true); setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8 space-y-5">
      <p className="eyebrow mb-2">Send message</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Target</label>
          <select
            value={target} onChange={(e) => setTarget(e.target.value as any)}
            className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
          >
            <option value="all_creators">All Creators (Broadcast)</option>
            <option value="single">Single Recipient</option>
          </select>
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {target === "single" && (
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Recipient Email</label>
          <input
            type="email" required value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
          />
        </div>
      )}

      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Subject</label>
        <input
          type="text" required value={subject} maxLength={200}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
        />
      </div>

      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Body</label>
        <textarea
          required rows={6} value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none resize-none text-base"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox" checked={requiresAck}
          onChange={(e) => setRequiresAck(e.target.checked)}
          className="w-4 h-4 accent-champagne"
        />
        <span className="text-cream/70 text-sm">Acknowledge required (Lesebestätigung erzwingen)</span>
      </label>

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">{error}</div>}
      {success && <div className="border border-green-500/40 bg-green-500/10 px-4 py-2 text-green-300 text-sm">Message sent.</div>}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
