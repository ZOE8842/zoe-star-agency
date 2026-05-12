"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addConversationMember, removeConversationMember } from "@/lib/inbox/conversations";

interface Option {
  id: string;
  label: string;
  hint?: string;
}

export function AddMemberButton({
  conversationId,
  candidates,
}: {
  conversationId: string;
  candidates: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = candidates
    .filter((c) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return c.label.toLowerCase().includes(q) || (c.hint ?? "").toLowerCase().includes(q);
    })
    .slice(0, 20);

  function add(id: string) {
    setError(null);
    startTransition(async () => {
      const r = await addConversationMember(conversationId, id);
      if (!r.ok) setError(r.error ?? "Fehler.");
      else {
        setOpen(false);
        setQuery("");
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]"
      >
        + Mitglied hinzufuegen
      </button>
    );
  }

  return (
    <div className="border border-champagne/30 p-3 space-y-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Suchen…"
        className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-2 text-cream text-sm focus:outline-none"
      />
      <ul className="max-h-48 overflow-y-auto space-y-1">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => add(c.id)}
              disabled={isPending}
              className="w-full text-left px-3 py-1.5 text-cream/85 text-sm hover:bg-champagne/10 disabled:opacity-50"
            >
              {c.label}
              {c.hint && <span className="text-cream/40 text-xs ml-2">{c.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-cream/40 hover:text-cream text-[10px] uppercase tracking-[0.25em]"
      >
        Schliessen
      </button>
      {error && <p className="text-red-300/85 text-xs">{error}</p>}
    </div>
  );
}

export function RemoveMemberButton({
  conversationId,
  profileId,
}: {
  conversationId: string;
  profileId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    startTransition(async () => {
      const r = await removeConversationMember(conversationId, profileId);
      if (!r.ok) setError(r.error ?? "Fehler.");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="text-cream/40 hover:text-red-300 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50"
      >
        {isPending ? "…" : "entfernen"}
      </button>
      {error && <p className="text-red-300/85 text-[10px] mt-1">{error}</p>}
    </>
  );
}
