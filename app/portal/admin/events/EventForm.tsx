"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = ["live", "battle", "ranking", "special", "announcement"] as const;

export function EventForm({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<typeof categories[number]>("live");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [maxParticipants, setMaxParticipants] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "open">("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);

    const startAt = new Date(`${date}T${time}:00`);

    const supabase = createClient();
    const { error: err } = await supabase.from("events").insert({
      title, description: description || null, category,
      start_at: startAt.toISOString(),
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
      status, created_by: adminId,
    });

    if (err) { setError(err.message); setLoading(false); return; }

    setTitle(""); setDescription(""); setDate(""); setTime("20:00"); setMaxParticipants("");
    setSuccess(true); setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8 space-y-5">
      <p className="eyebrow mb-2">Create event</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Title</label>
          <input
            type="text" required value={title} maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Description (optional)</label>
          <textarea
            rows={3} value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Status</label>
          <select
            value={status} onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="open">Open (Signup aktiv)</option>
          </select>
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Date</label>
          <input
            type="date" required value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
          />
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Time</label>
          <input
            type="time" required value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Max Participants (optional)</label>
          <input
            type="number" min={1} max={1000} value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            placeholder="leer = unbegrenzt"
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
          />
        </div>
      </div>

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">{error}</div>}
      {success && <div className="border border-green-500/40 bg-green-500/10 px-4 py-2 text-green-300 text-sm">Event created.</div>}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Creating..." : "Create event"}
      </button>
    </form>
  );
}
