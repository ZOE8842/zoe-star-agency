"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
