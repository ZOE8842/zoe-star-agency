"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminTriggerContentReview,
  adminResetContentReview,
  adminSetInReview,
  adminMarkReviewed,
} from "./admin-actions";

interface Props {
  id: string;
  kind: string;
  status: string;
  costUsd: number | null;
  processingStartedAt: string | null;
  reviewedAt: string | null;
  errorMessage: string | null;
  aiProvider: string | null;
  aiModel: string | null;
}

export function AdminTriggerPanel({
  id,
  kind,
  status,
  costUsd,
  processingStartedAt,
  reviewedAt,
  errorMessage,
  aiProvider,
  aiModel,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"ok" | "err">("ok");
  const [manualText, setManualText] = useState("");

  // Auto-Refresh waehrend der Worker laeuft: queued/processing pollt alle 4s
  // bis ein Endstatus erreicht ist. Verhindert dass die UI ewig "queued" zeigt.
  useEffect(() => {
    if (status !== "queued" && status !== "processing") return;
    const t = setInterval(() => {
      router.refresh();
    }, 4_000);
    return () => clearInterval(t);
  }, [status, router]);

  function run(
    label: string,
    fn: () => Promise<{ ok: boolean; error?: string; cost_usd?: number; queued?: boolean }>,
  ) {
    setFeedback(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setFeedbackTone("err");
        setFeedback(`${label}: ${r.error ?? "Fehler"}`);
      } else if (r.queued) {
        setFeedbackTone("ok");
        setFeedback(`${label} gestartet · läuft im Hintergrund`);
      } else {
        setFeedbackTone("ok");
        const costNote = typeof r.cost_usd === "number" && r.cost_usd > 0
          ? ` · $${r.cost_usd.toFixed(4)}`
          : "";
        setFeedback(`${label} OK${costNote}`);
      }
      router.refresh();
    });
  }

  const isImage = kind === "image";
  const isRunning = status === "queued" || status === "processing";

  return (
    <section className="border border-champagne/40 bg-champagne/[0.04] p-5 md:p-6 mb-8">
      <div className="flex items-baseline justify-between gap-3 mb-5 flex-wrap">
        <p className="eyebrow text-champagne">Admin · Trigger</p>
        <span className="text-cream/45 text-[10px] uppercase tracking-[0.25em]">
          Nur Admin sichtbar
        </span>
      </div>

      {/* Status-Block */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5 text-xs">
        <Stat label="Status" value={status} />
        <Stat label="Kind" value={kind} />
        <Stat label="Cost" value={costUsd ? `$${Number(costUsd).toFixed(4)}` : "—"} />
        <Stat label="AI" value={aiProvider ? `${aiProvider}${aiModel ? `/${aiModel}` : ""}` : "—"} />
        <Stat label="Started" value={processingStartedAt ? new Date(processingStartedAt).toLocaleString("de-DE") : "—"} />
        <Stat label="Reviewed" value={reviewedAt ? new Date(reviewedAt).toLocaleString("de-DE") : "—"} />
      </div>

      {errorMessage && (
        <div className="border border-red-400/40 bg-red-400/5 p-3 mb-4">
          <p className="text-red-300/85 text-xs font-mono break-all">{errorMessage}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {isImage ? (
          <button
            type="button"
            onClick={() =>
              run(status === "done" ? "Re-Run" : "Analyse", () =>
                adminTriggerContentReview(id),
              )
            }
            disabled={isPending || isRunning}
            className="btn-cta btn-shimmer disabled:opacity-40"
          >
            {isRunning
              ? (status === "queued" ? "In Warteschlange…" : "Analyse läuft…")
              : isPending
                ? "Starte…"
                : status === "done" ? "Erneut analysieren" : "Analyse starten"}
            {!isPending && !isRunning && <span className="btn-cta-arrow" aria-hidden>→</span>}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => run("Set in_review", () => adminSetInReview(id))}
            disabled={isPending}
            className="btn-cta-secondary disabled:opacity-40"
          >
            Auf in_review setzen
          </button>
        )}

        <button
          type="button"
          onClick={() => run("Reset", () => adminResetContentReview(id))}
          disabled={isPending}
          className="px-3 py-1.5 border border-cream/25 text-cream/65 text-[10px] uppercase tracking-[0.25em] hover:border-champagne/40 hover:text-cream disabled:opacity-40"
        >
          Fehler zuruecksetzen
        </button>
      </div>

      {/* Manual Review · für Video/Profile */}
      {!isImage && status === "in_review" && (
        <details className="mt-5 border-t border-champagne/10 pt-4">
          <summary className="cursor-pointer text-cream/65 text-[11px] uppercase tracking-[0.25em] hover:text-cream">
            Manuelle Review schreiben
          </summary>
          <div className="mt-3 space-y-3">
            <textarea
              rows={6}
              maxLength={4000}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Manuelle Review · Stimmung, Stärken, Schwächen, Fixes, Hook-Score …"
              className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none resize-none text-sm"
            />
            <button
              type="button"
              onClick={() => run("Manuell speichern", () => adminMarkReviewed(id, manualText))}
              disabled={isPending || !manualText.trim()}
              className="btn-cta-secondary disabled:opacity-40"
            >
              Review speichern + Status=reviewed
            </button>
          </div>
        </details>
      )}

      {feedback && (
        <p
          className={`text-xs mt-4 ${feedbackTone === "err" ? "text-red-300/85" : "text-champagne"}`}
        >
          {feedback}
        </p>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-champagne/15 p-2">
      <p className="text-cream/45 text-[9px] uppercase tracking-[0.22em] mb-0.5">{label}</p>
      <p className="text-cream/80 font-mono text-[11px] truncate" title={value}>{value}</p>
    </div>
  );
}
