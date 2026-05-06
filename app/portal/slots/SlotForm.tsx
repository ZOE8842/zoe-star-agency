"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SlotForm({ tiktokUsername }: { tiktokUsername: string }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const startAt = new Date(`${date}T${time}:00`);
    if (startAt <= new Date()) {
      setError("Start-Zeit muss in der Zukunft liegen.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Nicht eingeloggt.");
      setLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from("slots").insert({
      creator_id: user.id,
      start_at: startAt.toISOString(),
      duration_minutes: duration,
      tiktok_username: tiktokUsername,
      notes: notes || null,
      status: "planned",
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    setDate(""); setTime("20:00"); setDuration(60); setNotes("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8 space-y-5">
      <p className="eyebrow mb-2">Schedule a slot</p>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Date</label>
          <input
            type="date" required value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
          />
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Time</label>
          <input
            type="time" required value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
          />
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Duration (min)</label>
          <input
            type="number" required min={15} max={480} value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Notes (optional)</label>
        <input
          type="text" value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Ranking-Push · Battle-Day · Special Theme"
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
        />
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Saving..." : "Schedule slot"}
      </button>
    </form>
  );
}
