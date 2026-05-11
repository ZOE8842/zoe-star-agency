"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth-helpers";

export async function retryPlatformNotification(id: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("platform_notifications")
    .update({
      status: "queued",
      attempts: 0,
      error_message: null,
      last_attempt_at: null,
    })
    .eq("id", id)
    .in("status", ["failed", "skipped"]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/admin/notifications-queue");
  return { ok: true };
}

export async function cancelPlatformNotification(id: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("platform_notifications")
    .update({ status: "skipped", error_message: "manual cancel" })
    .eq("id", id)
    .in("status", ["queued", "failed"]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/admin/notifications-queue");
  return { ok: true };
}
