"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupConversation } from "@/lib/inbox/conversations";

interface MemberOption {
  id: string;
  label: string;
  hint?: string;
  role: string;
}

export function CreateGroupForm({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"group" | "channel" | "event">("group");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice(0, 40);
    return members
      .filter((m) =>
        m.label.toLowerCase().includes(q) || (m.hint ?? "").toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [query, members]);

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    if (title.trim().length < 2) {
      setError("Titel zu kurz.");
      return;
    }
    if (selected.size === 0) {
      setError("Mindestens ein Mitglied auswaehlen.");
      return;
    }
    startTransition(async () => {
      const r = await createGroupConversation({
        title: title.trim(),
        type,
        memberIds: Array.from(selected),
      });
      if (!r.ok) {
        setError(r.error ?? "Fehler.");
        return;
      }
      router.push(r.id ? `/portal/admin/inbox/groups/${r.id}` : "/portal/admin/inbox/groups");
      router.refresh();
    });
  }

  return (
    <div className="border border-champagne/15 p-6 md:p-8 space-y-6">
      <div>
        <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-2">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="z.B. Creator Community, Match Masters Juni"
          maxLength={120}
          className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-3">Typ</label>
        <div className="flex flex-wrap gap-2">
          {(["group", "channel", "event"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] border transition-colors ${
                type === t
                  ? "bg-champagne text-ink border-champagne"
                  : "border-champagne/30 text-cream/55 hover:border-champagne/60 hover:text-cream"
              }`}
            >
              {t === "group" ? "Gruppe" : t === "channel" ? "Channel" : "Event"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-3">
          Mitglieder ({selected.size} ausgewaehlt)
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen…"
          className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-2 text-cream text-base focus:outline-none placeholder-cream/30 mb-3"
        />
        <ul className="max-h-72 overflow-y-auto space-y-1">
          {filtered.map((m) => {
            const on = selected.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`w-full text-left px-3 py-2 border transition-colors flex items-center justify-between gap-3 ${
                    on
                      ? "border-champagne bg-champagne/10"
                      : "border-transparent hover:border-champagne/30 hover:bg-champagne/5"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${on ? "text-cream" : "text-cream/85"}`}>{m.label}</p>
                    {m.hint && (
                      <p className="text-cream/40 text-[10px] uppercase tracking-[0.22em]">
                        {m.hint} · {m.role}
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase tracking-[0.25em] shrink-0 ${on ? "text-champagne" : "text-cream/35"}`}>
                    {on ? "Drin" : "+"}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="text-cream/35 text-sm px-3 py-2">Keine Treffer.</li>
          )}
        </ul>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">{error}</div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="btn-cta btn-shimmer disabled:opacity-50"
      >
        {isPending ? "Lege an…" : "Gruppe anlegen"}
        {!isPending && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>
    </div>
  );
}
