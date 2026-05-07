"use server";

import { createClient as createSrvClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function ensureManagerOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return { ok: false, error: "Keine Berechtigung." };
  }
  return { ok: true, userId: user.id, role: profile.role };
}

function admin() {
  return createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function createNote(creatorId: string, body: string) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };
  if (!body || body.trim().length < 2) return { error: "Notiz zu kurz." };
  if (body.length > 10000) return { error: "Notiz zu lang." };

  const { error } = await admin().from("creator_notes").insert({
    creator_id: creatorId,
    author_id: auth.userId,
    body: body.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/users/${creatorId}`);
  return { success: true };
}

export async function updateNote(noteId: string, body: string) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };
  if (!body || body.trim().length < 2) return { error: "Notiz zu kurz." };
  if (body.length > 10000) return { error: "Notiz zu lang." };

  // Nur eigene Notes editierbar
  const { data: note } = await admin()
    .from("creator_notes")
    .select("author_id, creator_id")
    .eq("id", noteId)
    .maybeSingle();
  if (!note) return { error: "Notiz nicht gefunden." };
  if (note.author_id !== auth.userId && auth.role !== "admin") {
    return { error: "Nur eigene Notizen editierbar." };
  }

  const { error } = await admin()
    .from("creator_notes")
    .update({ body: body.trim(), updated_at: new Date().toISOString() })
    .eq("id", noteId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/users/${note.creator_id}`);
  return { success: true };
}

export async function deleteNote(noteId: string) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };

  const { data: note } = await admin()
    .from("creator_notes")
    .select("author_id, creator_id")
    .eq("id", noteId)
    .maybeSingle();
  if (!note) return { error: "Notiz nicht gefunden." };
  if (note.author_id !== auth.userId && auth.role !== "admin") {
    return { error: "Nur eigene Notizen loeschbar." };
  }

  const { error } = await admin().from("creator_notes").delete().eq("id", noteId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/users/${note.creator_id}`);
  return { success: true };
}
