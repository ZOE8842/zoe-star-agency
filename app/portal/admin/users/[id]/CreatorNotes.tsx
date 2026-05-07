"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNote, deleteNote } from "./notes-actions";

interface Note {
  id: string;
  body: string;
  created_at: string;
  updated_at: string | null;
  author_id: string;
  author_name?: string;
}

interface Props {
  creatorId: string;
  currentUserId: string;
  isAdmin: boolean;
  notes: Note[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CreatorNotes({ creatorId, currentUserId, isAdmin, notes }: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (body.trim().length < 2) return;
    setLoading(true);
    const result = await createNote(creatorId, body.trim());
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setBody("");
    setLoading(false);
    router.refresh();
  }

  async function remove(id: string) {
    setDeletingId(id);
    setError(null);
    const result = await deleteNote(id);
    if ("error" in result && result.error) {
      setError(result.error);
      setDeletingId(null);
      return;
    }
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      {/* Notes-Liste */}
      {notes.length === 0 ? (
        <p className="text-cream/30 italic text-sm mb-12">
          Noch keine Einträge in der Akte.
        </p>
      ) : (
        <ul className="space-y-12 mb-16">
          {notes.map((note) => {
            const isOwn = note.author_id === currentUserId;
            const canDelete = isOwn || isAdmin;
            return (
              <li key={note.id} className="border-b border-cream/[0.04] pb-10 last:border-b-0">
                <div className="flex items-baseline justify-between mb-4 text-[10px] uppercase tracking-[0.3em]">
                  <span className="text-cream/45">
                    {note.author_name || "—"}
                  </span>
                  <span className="text-cream/30">
                    {formatDate(note.created_at)}
                    {note.updated_at && (
                      <span className="ml-2 italic normal-case tracking-normal">
                        · bearbeitet
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-cream/80 text-base leading-[1.85] font-light whitespace-pre-wrap">
                  {note.body}
                </p>
                {canDelete && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(note.id)}
                      disabled={deletingId === note.id}
                      className="text-cream/30 hover:text-red-300 text-[10px] uppercase tracking-[0.3em] disabled:opacity-50 transition-colors"
                    >
                      {deletingId === note.id ? "Lösche…" : "Entfernen"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Compose */}
      <form onSubmit={add}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cream/40 mb-4">
          Neuer Eintrag
        </p>
        <textarea
          rows={5}
          maxLength={10000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Beobachtung, Einschätzung, Hinweis…"
          className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-3 text-cream/85 text-base leading-[1.75] font-light focus:outline-none placeholder-cream/20 resize-none transition-colors"
        />
        {error && (
          <p className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm mt-3">
            {error}
          </p>
        )}
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={loading || body.trim().length < 2}
            className="text-champagne hover:text-champagne-300 text-[11px] uppercase tracking-[0.3em] inline-flex items-center min-h-[40px] px-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Speichere…" : "Notiz speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
