"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendToConversation } from "@/lib/inbox/conversations";

export function GroupReplyForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (body.trim().length < 1) return;
    startTransition(async () => {
      const r = await sendToConversation({ conversationId, body: body.trim() });
      if (!r.ok) {
        setError(r.error ?? "Fehler.");
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="border-t border-cream/[0.06] pt-4 mt-6">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Antworten…"
        className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-2 text-cream text-base focus:outline-none placeholder-cream/30 resize-none"
      />
      <div className="flex items-center justify-between gap-3 mt-3">
        <span className="text-cream/25 text-[10px] uppercase tracking-[0.25em]">
          {body.length} / 5000
        </span>
        <button
          type="submit"
          disabled={isPending || body.trim().length < 1}
          className="btn-cta btn-shimmer disabled:opacity-40"
        >
          {isPending ? "Sende…" : "Senden"}
          {!isPending && <span className="btn-cta-arrow" aria-hidden>→</span>}
        </button>
      </div>
      {error && <p className="text-red-300/85 text-xs mt-2">{error}</p>}
    </form>
  );
}
