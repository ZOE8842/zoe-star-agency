"use client";

import { useState } from "react";

interface AttachmentMeta {
  path: string;
  // Optional Display-Name (sonst aus Path extrahiert)
  displayName?: string;
}

function deriveName(path: string): string {
  // Path-Format: <user_id>/<timestamp>-<rand>-<safeName>
  const last = path.split("/").pop() || path;
  // Strip "<digits>-<rand>-" prefix
  return last.replace(/^\d+-[a-z0-9]+-/i, "");
}

export function AttachmentList({ paths }: { paths: string[] }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!paths || paths.length === 0) return null;

  async function open(path: string) {
    setLoading(path);
    setError(null);
    const res = await fetch(`/api/messages/download?path=${encodeURIComponent(path)}`);
    const data = await res.json();
    setLoading(null);
    if (!res.ok || !data.url) {
      setError(data.error || "Download fehlgeschlagen.");
      return;
    }
    // Neuen Tab oeffnen statt navigieren
    window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-12 pt-8 border-t border-cream/[0.04]">
      <p className="text-cream/35 text-[10px] uppercase tracking-[0.3em] mb-5">
        Anlagen
      </p>
      <ul className="space-y-2">
        {paths.map((p) => {
          const name = deriveName(p);
          const isLoading = loading === p;
          return (
            <li key={p}>
              <button
                type="button"
                onClick={() => open(p)}
                disabled={isLoading}
                className="text-cream/70 hover:text-champagne text-sm font-light leading-relaxed transition-colors disabled:opacity-50 inline-flex items-baseline gap-3 min-h-[36px]"
              >
                <span className="truncate">{name}</span>
                <span className="text-cream/30 text-[10px] uppercase tracking-[0.3em] shrink-0">
                  {isLoading ? "Öffne…" : "Öffnen"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
