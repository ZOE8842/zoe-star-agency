"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { queuePlatformNotification } from "@/lib/notifications/platform";
import { queueInboxNotification, pushActivityFeed } from "@/lib/notifications/inbox";

const ALLOWED_STATUSES = [
  "requested", "in_review", "partner_found", "scheduled", "done", "rejected",
] as const;

type Status = (typeof ALLOWED_STATUSES)[number];

// Welche Statuswechsel triggern eine Creator-Notification?
function notificationFor(status: Status): { title: string; body: string } | null {
  switch (status) {
    case "partner_found":
      return {
        title: "ZOE hat einen passenden Big-Match-Partner gefunden",
        body: "Wir haben einen Gegner fuer dich — Details folgen sobald der Termin steht.",
      };
    case "scheduled":
      return {
        title: "Dein Big Match wurde geplant",
        body: "Termin steht. Schau in den Big-Match-Bereich fuer die Details.",
      };
    case "rejected":
      return {
        title: "Big-Match-Anfrage abgelehnt",
        body: "Wir haben aktuell keinen passenden Gegner. Du kannst eine neue Anfrage stellen.",
      };
    default:
      return null;
  }
}

export async function updateBigMatch(input: {
  id: string;
  status?: Status;
  admin_note?: string;
  scheduled_for?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, profile } = await requireAdmin();

  // Vorher-Status lesen damit wir Wechsel detecten
  const { data: prev } = await supabase
    .from("match_requests")
    .select("id, profile_id, status, scheduled_for")
    .eq("id", input.id)
    .single();
  if (!prev) return { ok: false, error: "Anfrage nicht gefunden." };

  const update: Record<string, unknown> = {
    reviewed_by: profile.id,
    reviewed_at: new Date().toISOString(),
  };

  if (input.status) {
    if (!ALLOWED_STATUSES.includes(input.status)) {
      return { ok: false, error: "Ungueltiger Status." };
    }
    update.status = input.status;
  }

  if (input.admin_note !== undefined) {
    update.admin_note = (input.admin_note || "").trim().slice(0, 1000) || null;
  }

  if (input.scheduled_for !== undefined) {
    update.scheduled_for = input.scheduled_for;
  }

  const { error } = await supabase
    .from("match_requests")
    .update(update)
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  // Notification + Activity-Feed nur bei echtem Status-Wechsel
  const statusChanged = input.status && input.status !== prev.status;
  if (statusChanged) {
    const notif = notificationFor(input.status!);
    if (notif) {
      // Bundle-Key 'match' — mehrere Big-Match-Updates in 24h kollabieren
      await queueInboxNotification(supabase, {
        user_id: prev.profile_id,
        type: "match",
        title: notif.title,
        body: notif.body,
        link: "/portal/services/big-match",
        bundle_key: "match",
      });
    }
    // activity_feed nur bei scheduled (positive Public-Info, ohne Personen-Detail)
    if (input.status === "scheduled") {
      await pushActivityFeed(supabase, {
        type: "match_scheduled",
        actor_id: prev.profile_id,
        headline: "Big Match geplant",
        extra: { scheduled_for: input.scheduled_for ?? prev.scheduled_for ?? null },
      });
    }

    // Platform-Notification (TikTok-DM-Bridge) — Worker-Queue
    const dmType =
      input.status === "scheduled" ? "match_scheduled"
      : input.status === "partner_found" ? "match_partner_found"
      : input.status === "rejected" ? "match_rejected" : null;
    if (dmType && notif) {
      await queuePlatformNotification(supabase, {
        profile_id: prev.profile_id,
        type: dmType,
        title: notif.title,
        body: dmType === "match_scheduled"
          ? "Hey 👋 dein Big Match wurde geplant. Schau bitte kurz in deine ZOE Inbox."
          : dmType === "match_partner_found"
          ? "Hey 👋 wir haben einen passenden Big-Match-Partner fuer dich. Details im ZOE Portal."
          : "Hey 👋 deine Big-Match-Anfrage konnten wir aktuell nicht matchen. Stell gerne eine neue Anfrage.",
        context_url: "/portal/services/big-match",
        priority: 3,
      });
    }
  }

  revalidatePath("/portal/admin/services/big-match");
  revalidatePath(`/portal/admin/services/big-match/${input.id}`);
  revalidatePath("/portal/services/big-match");
  revalidatePath("/portal/inbox");
  return { ok: true };
}
