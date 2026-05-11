"use client";

import { useState, useTransition } from "react";
import { adminSetInterest } from "./interest-actions";

interface Props {
  userId: string;
  showcaseStatus: "pending" | "accepted" | "declined";
  showcaseDecidedAt: string | null;
  showcaseNote: string | null;
  coopStatus: "pending" | "accepted" | "declined";
  coopDecidedAt: string | null;
  coopNote: string | null;
}

const STATUS_TONE: Record<string, string> = {
  pending: "border border-cream/25 text-cream/65",
  accepted: "bg-champagne text-ink",
  declined: "border border-red-400/40 text-red-300/85",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

export function InterestPanel({
  userId,
  showcaseStatus,
  showcaseDecidedAt,
  showcaseNote,
  coopStatus,
  coopDecidedAt,
  coopNote,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setStatus(kind: "showcase" | "cooperation", status: "pending" | "accepted" | "declined") {
    setError(null);
    startTransition(async () => {
      const r = await adminSetInterest(userId, kind, status);
      if (!r.ok) setError(r.error ?? "Fehler");
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <Section
        title="Showcase"
        status={showcaseStatus}
        decidedAt={showcaseDecidedAt}
        note={showcaseNote}
        isPending={isPending}
        onSet={(s) => setStatus("showcase", s)}
      />

      <Section
        title="Kooperationen"
        status={coopStatus}
        decidedAt={coopDecidedAt}
        note={coopNote}
        isPending={isPending}
        onSet={(s) => setStatus("cooperation", s)}
      />
    </div>
  );
}

function Section({
  title,
  status,
  decidedAt,
  note,
  isPending,
  onSet,
}: {
  title: string;
  status: "pending" | "accepted" | "declined";
  decidedAt: string | null;
  note: string | null;
  isPending: boolean;
  onSet: (s: "pending" | "accepted" | "declined") => void;
}) {
  return (
    <div className="border border-champagne/15 p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <p className="font-display italic text-cream text-lg">{title}</p>
        <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      {decidedAt && (
        <p className="text-cream/45 text-[11px] mb-2">
          Entschieden am {new Date(decidedAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      )}
      {note && (
        <p className="text-cream/65 text-sm italic mb-3">„{note}"</p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {(["pending", "accepted", "declined"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSet(s)}
            disabled={isPending || s === status}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              s === status
                ? "border-champagne text-champagne bg-champagne/10"
                : "border-cream/20 text-cream/65 hover:border-champagne/40 hover:text-cream"
            }`}
          >
            {s === "pending" && "→ Pending"}
            {s === "accepted" && "✓ Accepted"}
            {s === "declined" && "× Declined"}
          </button>
        ))}
      </div>
    </div>
  );
}
