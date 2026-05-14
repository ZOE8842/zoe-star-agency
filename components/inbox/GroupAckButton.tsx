"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeGroupMessage } from "@/app/portal/inbox/[id]/actions";

interface Props {
  messageId: string;
  conversationId: string;
  acknowledged: boolean;
  ackCount?: number;
  showCount?: boolean;
}

export function GroupAckButton({
  messageId,
  conversationId,
  acknowledged,
  ackCount,
  showCount,
}: Props) {
  const router = useRouter();
  const [done, setDone] = useState(acknowledged);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (done || isPending) return;
    startTransition(async () => {
      const r = await acknowledgeGroupMessage(messageId, conversationId);
      if (r.error) return;
      setDone(true);
      router.refresh();
    });
  }

  if (done) {
    return (
      <p className="text-champagne text-[10px] uppercase tracking-[0.25em] mt-2">
        Bestaetigt
        {showCount && typeof ackCount === "number" && ackCount > 0 ? ` · ${ackCount} Bestaetigungen` : ""}
      </p>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={submit}
        disabled={isPending}
        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] border border-champagne text-champagne hover:bg-champagne hover:text-ink transition-colors disabled:opacity-50"
      >
        {isPending ? "Sende…" : "Bestaetigen"}
      </button>
      {showCount && typeof ackCount === "number" && ackCount > 0 && (
        <span className="text-cream/45 text-[10px] uppercase tracking-[0.25em]">
          {ackCount} bereits bestaetigt
        </span>
      )}
    </div>
  );
}
