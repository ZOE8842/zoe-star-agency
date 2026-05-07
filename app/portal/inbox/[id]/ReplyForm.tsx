"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "../compose/actions";

export function ReplyForm({
  recipientId,
  defaultSubject,
}: {
  recipientId: string;
  defaultSubject: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (body.trim().length < 5) {
      setError("Antwort zu kurz.");
      return;
    }

    setLoading(true);
    const result = await sendMessage({
      recipientId,
      subject: defaultSubject,
      body: body.trim(),
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSent(true);
    setBody("");
    setLoading(false);
    router.refresh();
  }

  if (sent) {
    return (
      <p className="text-champagne text-[11px] uppercase tracking-[0.3em]">
        ✓ Antwort gesendet
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      <textarea
        rows={6}
        maxLength={5000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="In Ruhe antworten."
        className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-3 text-cream/85 text-base md:text-lg leading-[1.75] font-light focus:outline-none placeholder-cream/20 resize-none transition-colors"
      />

      {error && (
        <div className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm mt-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={loading || body.trim().length < 5}
          className="text-champagne hover:text-champagne-300 text-[11px] uppercase tracking-[0.3em] inline-flex items-center min-h-[40px] px-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sende…" : "Antwort senden"}
        </button>
      </div>
    </form>
  );
}
