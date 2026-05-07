"use client";

import { useState } from "react";
import { acknowledgeMessage } from "./actions";

export function AcknowledgeButton({
  messageId,
  userId: _userId,
}: {
  messageId: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setLoading(true);
    setError(null);
    const result = await acknowledgeMessage(messageId);
    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
    }
    // success: revalidate triggert Server-Re-Render
  }

  return (
    <div>
      <button
        type="button"
        onClick={handle}
        disabled={loading}
        className="btn-primary disabled:opacity-50"
      >
        {loading ? "Speichere…" : "Gelesen & verstanden"}
      </button>
      {error && (
        <p className="text-red-300 text-sm mt-3">{error}</p>
      )}
    </div>
  );
}
