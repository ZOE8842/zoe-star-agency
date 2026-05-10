"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "@/app/portal/inbox/actions";

interface ReactionGroup {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
}

interface Props {
  messageId: string;
  initialReactions: ReactionGroup[];
}

const EMOJI_PALETTE = ["👍", "❤️", "🔥", "🎉", "👀", "🙌"];

export function ReactionBar({ messageId, initialReactions }: Props) {
  const [reactions, setReactions] = useState<ReactionGroup[]>(initialReactions);
  const [showPalette, setShowPalette] = useState(false);
  const [, startTransition] = useTransition();

  const click = (emoji: string) => {
    // optimistisches UI
    setReactions((rs) => {
      const found = rs.find((r) => r.emoji === emoji);
      if (found) {
        if (found.reacted_by_me) {
          if (found.count <= 1) return rs.filter((r) => r.emoji !== emoji);
          return rs.map((r) =>
            r.emoji === emoji ? { ...r, count: r.count - 1, reacted_by_me: false } : r,
          );
        }
        return rs.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count + 1, reacted_by_me: true } : r,
        );
      }
      return [...rs, { emoji, count: 1, reacted_by_me: true }];
    });
    setShowPalette(false);
    startTransition(async () => {
      await toggleReaction(messageId, emoji);
    });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-3">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => click(r.emoji)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border transition-colors ${
            r.reacted_by_me
              ? "border-champagne bg-champagne/10 text-champagne"
              : "border-champagne/15 hover:border-champagne/40 text-cream/70"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="text-[11px]">{r.count}</span>
        </button>
      ))}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPalette((v) => !v)}
          className="inline-flex items-center justify-center w-7 h-7 border border-champagne/15 hover:border-champagne/40 text-cream/55 text-xs"
          aria-label="Reaktion hinzufuegen"
        >
          +
        </button>
        {showPalette && (
          <div className="absolute z-20 left-0 mt-1 flex gap-0.5 border border-champagne/30 bg-ink p-1 shadow-xl">
            {EMOJI_PALETTE.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => click(e)}
                className="px-2 py-1 hover:bg-champagne/10 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
