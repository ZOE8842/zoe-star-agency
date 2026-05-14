"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEventChat, syncEventChatMembers } from "../chat-actions";

interface Props {
  eventId: string;
  chatConversationId: string | null;
}

export function EventChatActions({ eventId, chatConversationId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onCreate() {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await createEventChat(eventId);
      if (!r.ok) {
        setErr(r.error ?? "Fehler.");
        return;
      }
      setMsg("Chat angelegt.");
      router.refresh();
    });
  }

  function onSync() {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const r = await syncEventChatMembers(eventId);
      if (!r.ok) {
        setErr(r.error ?? "Fehler.");
        return;
      }
      setMsg(`Sync ok · ${r.added ?? 0} neue Mitglieder hinzugefuegt.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {chatConversationId ? (
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/portal/inbox/group/${chatConversationId}`}
            className="btn-cta btn-shimmer"
          >
            Chat oeffnen
            <span className="btn-cta-arrow" aria-hidden>→</span>
          </Link>
          <button
            type="button"
            onClick={onSync}
            disabled={isPending}
            className="text-cream/55 hover:text-champagne text-[10px] uppercase tracking-[0.25em] px-3 py-2 border border-champagne/20 disabled:opacity-50"
          >
            {isPending ? "Sync…" : "Members synchronisieren"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          disabled={isPending}
          className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50"
        >
          {isPending ? "Erstelle…" : "Event-Chat erstellen"}
        </button>
      )}
      {msg && <p className="text-green-300/85 text-xs">{msg}</p>}
      {err && <p className="text-red-300/85 text-xs">{err}</p>}
    </div>
  );
}
