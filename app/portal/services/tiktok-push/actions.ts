"use server";

// Creator-Server-Actions fuer TikTok Push.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  nextMonday,
  weekKey,
  validateSlots,
  type SlotInput,
} from "@/lib/services/week";

interface SubmitInput {
  slots: SlotInput[];
  note?: string;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function submitPushRequest(input: SubmitInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const monday = nextMonday();
  const v = validateSlots(input.slots, monday);
  if (!v.ok) return { ok: false, error: v.error };

  const note = (input.note || "").trim().slice(0, 240) || null;

  // upsert: pro profile_id+week genau ein Request, neue Submits ueberschreiben
  // alte mit Status "submitted" zurueck.
  const { error } = await supabase
    .from("tiktok_push_requests")
    .upsert(
      {
        profile_id: user.id,
        week_start_monday: weekKey(monday),
        requested_slots: input.slots.slice(0, 3),
        status: "submitted",
        note,
      },
      { onConflict: "profile_id,week_start_monday" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/services/tiktok-push");
  revalidatePath("/portal");
  return { ok: true };
}

export async function cancelPushRequest(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  // Eigene Request, nur wenn noch im submitted/reviewed-Stadium
  const { error } = await supabase
    .from("tiktok_push_requests")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("profile_id", user.id)
    .in("status", ["submitted", "reviewed"]);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/services/tiktok-push");
  revalidatePath("/portal");
  return { ok: true };
}
