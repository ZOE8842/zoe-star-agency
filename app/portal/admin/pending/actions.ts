"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { queueInboxNotification, pushActivityFeed } from "@/lib/notifications/inbox";

export async function approvePendingCreator(
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();

  const { data: prev } = await supabase
    .from("profiles")
    .select("id, role, status, display_name, tiktok_username")
    .eq("id", profileId)
    .single();
  if (!prev) return { ok: false, error: "Creator nicht gefunden." };
  if (prev.role !== "creator") return { ok: false, error: "Nur Creator-Profile freigeben." };
  if (prev.status !== "pending") return { ok: false, error: "Creator ist nicht pending." };

  const { error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", profileId);
  if (error) return { ok: false, error: error.message };

  // Inbox-Notification fuer Creator
  await queueInboxNotification(supabase, {
    user_id: profileId,
    type: "badge",
    title: "Du bist drin · Aufnahme bestaetigt",
    body: "Dein Profil ist von ZOE freigegeben. Ab jetzt voller Zugang.",
    link: "/portal",
  });

  // Activity-Feed-Eintrag (public · all_creators)
  await pushActivityFeed(supabase, {
    type: "creator_joined",
    actor_id: profileId,
    headline: `Neuer Creator: ${prev.display_name || prev.tiktok_username}`,
  });

  revalidatePath("/portal/admin/pending");
  revalidatePath("/portal/admin");
  return { ok: true };
}

export async function rejectPendingCreator(
  profileId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  const { data: prev } = await supabase
    .from("profiles")
    .select("role, status").eq("id", profileId).single();
  if (!prev || prev.role !== "creator" || prev.status !== "pending") {
    return { ok: false, error: "Nicht in pending-Status." };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ status: "inactive" })
    .eq("id", profileId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/admin/pending");
  revalidatePath("/portal/admin");
  return { ok: true };
}
