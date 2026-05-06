"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = [
  { value: "payout", label: "Payout" },
  { value: "contract", label: "Contract" },
  { value: "event", label: "Event" },
  { value: "tech", label: "Tech" },
  { value: "traffic", label: "Traffic" },
  { value: "general", label: "General" },
];

export function TicketForm() {
  const router = useRouter();
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Nicht eingeloggt."); setLoading(false); return; }

    const { error: err } = await supabase.from("support_tickets").insert({
      creator_id: user.id,
      category,
      subject,
      body,
      status: "open",
    });

    if (err) { setError(err.message); setLoading(false); return; }

    setSubject(""); setBody(""); setCategory("general"); setSuccess(true); setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8 space-y-5">
      <p className="eyebrow mb-2">Open ticket</p>
      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Category</label>
        <select
          value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
        >
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Subject</label>
        <input
          type="text" required value={subject} maxLength={120}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
        />
      </div>
      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Message</label>
        <textarea
          required rows={5} value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none resize-none"
        />
      </div>

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>}
      {success && <div className="border border-green-500/40 bg-green-500/10 px-4 py-3 text-green-300 text-sm">Ticket created.</div>}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Sending..." : "Open ticket"}
      </button>
    </form>
  );
}
