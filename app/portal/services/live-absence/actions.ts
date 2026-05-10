"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateAbsence, type AbsenceInput } from "@/lib/services/absence";

export async function submitAbsence(
  input: AbsenceInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const v = validateAbsence(input);
  if (!v.ok) return { ok: false, error: v.error };

  const note = (input.note || "").trim().slice(0, 240) || null;

  const { error } = await supabase.from("live_absences").insert({
    profile_id: user.id,
    reason: input.reason,
    period_start: input.period_start,
    period_end: input.period_end,
    note,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/services/live-absence");
  revalidatePath("/portal/services");
  return { ok: true };
}
