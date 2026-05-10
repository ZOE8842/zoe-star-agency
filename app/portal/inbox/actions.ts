"use server";

// Inbox V1 Server-Actions: Reactions toggle.

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EMOJI = ["👍", "❤️", "🔥", "🎉", "👀", "🙌"] as const;

export async function toggleReaction(
  messageId: string,
  emoji: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!ALLOWED_EMOJI.includes(emoji as never)) {
    return { ok: false, error: "Emoji nicht erlaubt." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("profile_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("message_reactions")
      .insert({ message_id: messageId, profile_id: user.id, emoji });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/portal/inbox");
  revalidatePath(`/portal/inbox/${messageId}`);
  return { ok: true };
}
