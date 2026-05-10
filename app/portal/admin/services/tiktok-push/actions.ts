"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_STATUS = ["submitted", "reviewed", "selected", "not_selected", "cancelled"] as const;
type Status = (typeof ALLOWED_STATUS)[number];

export async function adminUpdatePushStatus(id: string, status: Status): Promise<{ ok: boolean; error?: string }> {
  if (!ALLOWED_STATUS.includes(status)) return { ok: false, error: "Status ungueltig." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!caller || caller.role !== "admin") return { ok: false, error: "Nur Admin." };

  const { error } = await supabase
    .from("tiktok_push_requests")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/admin/services/tiktok-push");
  return { ok: true };
}
