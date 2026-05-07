"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "./actions";
import { AttachmentField, type UploadedAttachment } from "@/components/AttachmentField";

export function ComposeForm({
  recipientId,
  recipientName: _recipientName,
}: {
  recipientId: string;
  recipientName: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
      recipientId,
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
