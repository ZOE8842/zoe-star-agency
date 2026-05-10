"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validatePhoneRequest,
  type PhoneRequestInput,
} from "@/lib/services/phone";

export async function submitPhoneRequest(
  input: PhoneRequestInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const v = validatePhoneRequest(input);
  if (!v.ok) return { ok: false, error: v.error };

  const note = (input.note || "").trim().slice(0, 240) || null;
  const cv = input.contact_value.trim().slice(0, 200);

  const { error } = await supabase.from("phone_call_requests").insert({
    profile_id: user.id,
    channel: input.channel,
    contact_value: cv,
    earliest_at: input.earliest_at,
    latest_at: input.latest_at,
    note,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/services/phone-request");
  revalidatePath("/portal/services");
  return { ok: true };
}
