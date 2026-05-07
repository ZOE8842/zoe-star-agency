"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCampaignStatus } from "../actions";

const STATUSES = [
  { key: "draft", label: "Entwurf" },
  { key: "active", label: "Aktiv" },
  { key: "paused", label: "Pausiert" },
  { key: "completed", label: "Abgeschlossen" },
  { key: "archived", label: "Archiv" },
] as const;

export function CampaignStatusToggle({
  campaignId,
  currentStatus,
}: {
  campaignId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    setLoading(true);
    setError(null);
    const result = await updateCampaignStatus(campaignId, next);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setStatus(next);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => change(s.key)}
            disabled={loading || s.key === status}
            className={`text-[10px] uppercase tracking-[0.25em] inline-flex items-center min-h-[40px] px-4 transition-colors ${
              s.key === status
                ? "bg-champagne text-ink"
                : "border border-cream/[0.1] hover:border-champagne text-cream/70 hover:text-champagne"
            } disabled:opacity-50`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {error && (
        <div className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
