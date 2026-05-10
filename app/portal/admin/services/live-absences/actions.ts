"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = ["submitted", "seen", "resolved"] as const;

export async function adminUpdateAbsenceStatus(
  id: string,
  status: (typeof ALLOWED)[number],
): Promise<{ ok: boolean; error?: string }> {
  if (!ALLOWED.includes(status)) return { ok: false, error: "Status ungueltig." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };
  const { data: caller } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!caller || caller.role !== "admin") return { ok: false, error: "Nur Admin." };

  const { error } = await supabase
    .from("live_absences")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/admin/services/live-absences");
  return { ok: true };
}
