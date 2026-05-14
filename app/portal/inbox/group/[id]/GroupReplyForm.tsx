"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendToConversation } from "@/lib/inbox/conversations";

interface Props {
  conversationId: string;
  /** Wenn true: Toggle "Bestaetigung erforderlich" wird angezeigt (Channel + Staff). */
  showAckToggle?: boolean;
}

export function GroupReplyForm({ conversationId, showAckToggle = false }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [requiresAck, setRequiresAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (body.trim().length < 1) return;
    startTransition(async () => {
      const r = await sendToConversation({
        conversationId,
        body: body.trim(),
        requires_ack: showAckToggle && requiresAck,
      });
      if (!r.ok) {
        setError(r.error ?? "Fehler.");
        return;
      }
      setBody("");
      setRequiresAck(false);
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
      {showAckToggle && (
        <label className="mt-3 flex items-center gap-2 text-cream/55 text-[10px] uppercase tracking-[0.25em] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={requiresAck}
            onChange={(e) => setRequiresAck(e.target.checked)}
            className="accent-champagne"
          />
          Bestaetigung erforderlich
        </label>
      )}
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
