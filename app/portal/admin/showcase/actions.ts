"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { queuePlatformNotification } from "@/lib/notifications/platform";
import { queueInboxNotification, pushActivityFeed } from "@/lib/notifications/inbox";
import { invalidateShowcase } from "@/lib/showcase/invalidation";

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
      .select("profile_id, is_approved, showcase_images")
      .eq("id", id)
      .single();

    // V2 · Pflicht-Check: 2 Bilder
    const imgs = Array.isArray(prev?.showcase_images)
      ? (prev.showcase_images as Array<{ url?: string }>)
      : [];
    const validCount = imgs.filter((i) => i?.url && /^https?:\/\//i.test(i.url)).length;
    if (validCount < 2) {
      return { ok: false, error: `Approve blockiert · nur ${validCount}/2 Bilder. Creator muss erst zweites Bild hochladen.` };
    }

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
    await invalidateShowcase();
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
    await invalidateShowcase();
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
    await invalidateShowcase();
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
    await invalidateShowcase();
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler." };
  }
}

export interface ShowcaseAdminUpdate {
  category?: string | null;
  brand_safe?: boolean;
  public_note?: string | null;
  tiktok_url?: string | null;
  instagram_url?: string | null;
  // profiles-Felder (separater Update-Pfad):
  bio?: string | null;
  region?: string | null;
  language?: string | null;
}

// Server-Side Validation · Browser-Validation ist keine Sicherheits-Grenze.
const ALLOWED_CATEGORIES = new Set([
  "Lifestyle", "Beauty", "Fashion", "Familie",
  "Gaming", "Comedy", "Talk", "Musik", "Motivation", "Sonstiges",
]);
const ALLOWED_REGIONS = new Set(["DE", "AT", "CH", "LI", "EU", "OTHER"]);
const ALLOWED_LANGUAGES = new Set(["de", "en", "tr", "fr", "ar"]);

function cleanHttpsUrl(v: string | null | undefined, hostSuffix: string): string | null {
  if (!v || typeof v !== "string") return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    if (!url.hostname.endsWith(hostSuffix)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function clip(v: string | null | undefined, max: number): string | null {
  if (!v || typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export async function updateShowcaseAdmin(
  id: string,
  patch: ShowcaseAdminUpdate,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireAdminClient();

    // showcase_creators-Felder · validiert
    const scPatch: Record<string, unknown> = {};
    if (patch.category !== undefined) {
      scPatch.category = patch.category && ALLOWED_CATEGORIES.has(patch.category) ? patch.category : null;
    }
    if (patch.brand_safe !== undefined) scPatch.brand_safe = !!patch.brand_safe;
    if (patch.public_note !== undefined) scPatch.public_note = clip(patch.public_note, 500);
    if (patch.tiktok_url !== undefined) scPatch.tiktok_url = cleanHttpsUrl(patch.tiktok_url, "tiktok.com");
    if (patch.instagram_url !== undefined) scPatch.instagram_url = cleanHttpsUrl(patch.instagram_url, "instagram.com");

    if (Object.keys(scPatch).length > 0) {
      const { error } = await supabase
        .from("showcase_creators")
        .update(scPatch)
        .eq("id", id);
      if (error) return { ok: false, error: `showcase: ${error.message}` };
    }

    // profiles-Felder ueber profile_id · validiert
    const profPatch: Record<string, unknown> = {};
    if (patch.bio !== undefined) profPatch.bio = clip(patch.bio, 240);
    if (patch.region !== undefined) {
      profPatch.region = patch.region && ALLOWED_REGIONS.has(patch.region) ? patch.region : null;
    }
    if (patch.language !== undefined) {
      profPatch.language = patch.language && ALLOWED_LANGUAGES.has(patch.language) ? patch.language : null;
    }

    if (Object.keys(profPatch).length > 0) {
      const { data: row } = await supabase
        .from("showcase_creators")
        .select("profile_id")
        .eq("id", id)
        .single();
      if (row?.profile_id) {
        const { error } = await supabase
          .from("profiles")
          .update(profPatch)
          .eq("id", row.profile_id);
        if (error) return { ok: false, error: `profile: ${error.message}` };
      }
    }

    revalidatePath("/portal/admin/showcase");
    await invalidateShowcase();
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
    await invalidateShowcase();
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Fehler." };
  }
}
