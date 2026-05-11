"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "./actions";
import { AttachmentField, type UploadedAttachment } from "@/components/AttachmentField";

export interface RecipientOption {
  id: string;
  label: string;
  hint?: string;
}

export function ComposeForm({
  recipientId,
  recipientName: _recipientName,
  recipientOptions,
}: {
  recipientId: string;
  recipientName: string;
  recipientOptions?: RecipientOption[];
}) {
  const router = useRouter();
  const hasPicker = (recipientOptions?.length ?? 0) > 0;
  const [selectedRecipient, setSelectedRecipient] = useState<string>(
    hasPicker ? "" : recipientId,
  );
  const [recipientQuery, setRecipientQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRecipients = useMemo(() => {
    if (!recipientOptions) return [];
    const q = recipientQuery.trim().toLowerCase();
    if (!q) return recipientOptions.slice(0, 12);
    return recipientOptions
      .filter((r) =>
        r.label.toLowerCase().includes(q) ||
        (r.hint?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 12);
  }, [recipientOptions, recipientQuery]);

  const selectedRecipientLabel = useMemo(() => {
    if (!hasPicker || !selectedRecipient) return null;
    return recipientOptions?.find((r) => r.id === selectedRecipient)?.label ?? null;
  }, [hasPicker, selectedRecipient, recipientOptions]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const targetId = hasPicker ? selectedRecipient : recipientId;
    if (!targetId) {
      setError("Bitte einen Empfaenger auswaehlen.");
      return;
    }
    if (subject.trim().length < 2) {
      setError("Bitte gib einen Betreff an.");
      return;
    }
    if (body.trim().length < 10) {
      setError("Die Nachricht ist zu kurz.");
      return;
    }

    setLoading(true);
    const result = await sendMessage({
      recipientId: targetId,
      subject: subject.trim(),
      body: body.trim(),
      attachments: attachments.map((a) => a.path),
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/portal/inbox");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-12">
      {/* Recipient-Picker — nur fuer Admin/Manager mit Optionen */}
      {hasPicker && (
        <div>
          <label htmlFor="recipient-search" className="block text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-4">
            Empfaenger
          </label>
          {selectedRecipient ? (
            <div className="flex items-center gap-3 mb-3">
              <span className="border border-champagne/40 text-champagne px-3 py-1.5 text-sm">
                {selectedRecipientLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedRecipient("");
                  setRecipientQuery("");
                }}
                className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
              >
                aendern
              </button>
            </div>
          ) : (
            <>
              <input
                id="recipient-search"
                type="search"
                value={recipientQuery}
                onChange={(e) => setRecipientQuery(e.target.value)}
                placeholder="Creator suchen…"
                className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-3 text-cream/85 text-base focus:outline-none placeholder-cream/30 transition-colors mb-3"
              />
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {filteredRecipients.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipient(r.id);
                        setRecipientQuery("");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-champagne/5 border border-transparent hover:border-champagne/30 transition-colors flex items-baseline justify-between gap-3"
                    >
                      <span className="text-cream text-sm">{r.label}</span>
                      {r.hint && (
                        <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] shrink-0">
                          {r.hint}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
                {filteredRecipients.length === 0 && (
                  <li className="text-cream/35 text-sm px-3 py-2">Keine Treffer.</li>
                )}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Subject — als Hero-Input ohne sichtbaren Border */}
      <div>
        <label htmlFor="subject" className="block text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-4">
          Betreff
        </label>
        <input
          id="subject"
          type="text"
          required
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Worum geht es?"
          className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-3 text-cream font-display italic text-2xl md:text-3xl leading-tight tracking-[-0.01em] focus:outline-none placeholder-cream/20 transition-colors"
        />
      </div>

      {/* Body — als Reading-Editor */}
      <div>
        <label htmlFor="body" className="block text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-4">
          Nachricht
        </label>
        <textarea
          id="body"
          required
          rows={10}
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Schreib in Ruhe."
          className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-3 text-cream/85 text-base md:text-lg leading-[1.75] font-light focus:outline-none placeholder-cream/20 resize-none transition-colors"
        />
        <p className="text-cream/25 text-[10px] uppercase tracking-[0.3em] mt-3 text-right">
          {body.length} / 5000
        </p>
      </div>

      {/* Anlagen */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-4">
          Anlagen
        </p>
        <AttachmentField attachments={attachments} onChange={setAttachments} />
      </div>

      {error && (
        <div className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/portal/inbox")}
          className="text-cream/45 hover:text-cream text-[11px] uppercase tracking-[0.3em] transition-colors px-4 py-3"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "Sende…" : "Nachricht senden"}
        </button>
      </div>
    </form>
  );
}
