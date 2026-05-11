"use client";

// Inbox-Realtime · subscribed Supabase-Channel auf notifications + activity_feed
// und triggert ein subtiles router.refresh wenn ein neuer Eintrag kommt.
// Reagiert auch auf messages-Inserts (DMs / Broadcasts).
//
// Kein WebSocket-Spam — wir refreshen NUR wenn ein Event den User
// tatsaechlich betrifft.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function InboxRealtime({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    let pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      // De-dupe innerhalb 1.5s — wenn mehrere events binnen kuerzester
      // Zeit kommen, nur 1 refresh.
      setTimeout(() => {
        pending = false;
        router.refresh();
      }, 1500);
    }

    const ch = supabase
      .channel(`inbox-realtime-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => schedule(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => schedule(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_feed" },
        () => schedule(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as { recipient_id?: string; recipient_group?: string };
          if (row.recipient_id === userId || row.recipient_group === "all_creators") {
            schedule();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [router, userId]);

  return null;
}
