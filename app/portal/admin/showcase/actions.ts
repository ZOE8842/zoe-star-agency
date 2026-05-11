"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { queuePlatformNotification } from "@/lib/notifications/platform";
import { queueInboxNotification, pushActivityFeed } from "@/lib/notifications/inbox";

async function requireAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") throw new Error("Nur Admin.");
  return { supabase, userId: user.id };
}

export async function approveShowcase(id: string, featured: boolean = true): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase, userId } = await requireAdminClient();

    // Vorher-Status lesen damit wir Push nur bei echtem Approve-Wechsel triggern
    const { data: prev } = await supabase
      .from("showcase_creators")
      .select("profile_id, is_approved")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("showcase_creators")
      .update({
        is_approved: true,
        is_featured: featured,
        approved_at: new Date().toISOString(),
        approved_by: userId,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };

    // Bei Wechsel false → true: Inbox + Activity-Feed + External-Push-Queue
    if (prev && !prev.is_approved && featured) {
      await queueInboxNotification(supabase, {
        user_id: prev.profile_id,
        type: "badge",
        title: "Dein Showcase wurde bestaetigt",
        body: "Dein Showcase wurde bestaetigt ⭐ Du bist jetzt im naechsten Schritt.",
        link: "/portal/profile/showcase",
      });
      await pushActivityFeed(supabase, {
        type: "showcase_approved",
        actor_id: prev.profile_id,
        headline: "Showcase freigegeben",
      });
      await queuePlatformNotification(supabase, {
        profile_id: prev.profile_id,
        type: "showcase_approved",
        title: "Dein Showcase wurde bestaetigt",
        body: "Dein Showcase wurde bestaetigt ⭐ Du bist jetzt im naechsten Schritt.",
        context_url: "/portal/profile/showcase",
        priority: 3,
      });
    }

    revalidatePath("/portal/admin/showcase");
    revalidatePath("/");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler." };
  }
}

export async function rejectShowcase(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase
      .from("showcase_creators")
      .update({
        is_approved: false,
        is_featured: false,
        approved_at: null,
        approved_by: null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/portal/admin/showcase");
    revalidatePath("/");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler." };
  }
}

export async function toggleFeatured(id: string, featured: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase
      .from("showcase_creators")
      .update({ is_featured: featured })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/portal/admin/showcase");
    revalidatePath("/");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler." };
  }
}

export async function updateSortOrder(id: string, sort_order: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase
      .from("showcase_creators")
      .update({ sort_order })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/portal/admin/showcase");
    revalidatePath("/");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler." };
  }
}

export async function deleteShowcaseAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdminClient();
    const { error } = await supabase
      .from("showcase_creators")
      .delete()
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/portal/admin/showcase");
    revalidatePath("/");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler." };
  }
}
