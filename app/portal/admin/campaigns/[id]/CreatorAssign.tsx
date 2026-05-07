"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { attachCreator, detachCreator } from "../actions";

interface CreatorRef {
  id: string;
  display_name: string;
  tiktok_username: string;
}

export function CreatorAssign({
  campaignId,
  assigned,
  available,
}: {
  campaignId: string;
  assigned: CreatorRef[];
  available: CreatorRef[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function attach(creatorId: string) {
    setLoading(creatorId);
    setError(null);
    const res = await attachCreator(campaignId, creatorId);
    if ("error" in res && res.error) setError(res.error);
    else router.refresh();
    setLoading(null);
  }

  async function detach(creatorId: string) {
    setLoading(creatorId);
    setError(null);
    const res = await detachCreator(campaignId, creatorId);
    if ("error" in res && res.error) setError(res.error);
    else router.refresh();
    setLoading(null);
  }

  return (
    <div className="space-y-10">
      {/* Aktuell zugewiesen */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cream/40 mb-4">
          Im Roster der Kampagne
        </p>
        {assigned.length === 0 ? (
          <p className="text-cream/30 italic text-sm">Noch niemand zugewiesen.</p>
        ) : (
          <ul className="space-y-2">
            {assigned.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-cream text-base font-light">{c.display_name}</p>
                  <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                    @{c.tiktok_username}
                  </p>
                </div>
                <button
                  onClick={() => detach(c.id)}
                  disabled={loading === c.id}
                  className="text-cream/30 hover:text-red-300 text-[10px] uppercase tracking-[0.3em] disabled:opacity-50 transition-colors"
                >
                  {loading === c.id ? "Lösche…" : "Entfernen"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Verfuegbar */}
      {available.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-cream/40 mb-4">
            Verfügbare Creator
          </p>
          <div className="flex flex-wrap gap-2">
            {available.map((c) => (
              <button
                key={c.id}
                onClick={() => attach(c.id)}
                disabled={loading === c.id}
                className="text-[10px] uppercase tracking-[0.25em] inline-flex items-center min-h-[40px] px-4 border border-cream/[0.1] hover:border-champagne text-cream/70 hover:text-champagne transition-colors disabled:opacity-50"
              >
                + {c.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
