"use server";

import { createClient as createSrvClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES = ["creator", "manager", "admin"];
const ALLOWED_STATUS = ["active", "paused", "suspended"];

async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { ok: false, error: "Kein Admin-Recht." };
  return { ok: true };
}

function admin() {
  return createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function updateUserRole(userId: string, role: string) {
  const auth = await ensureAdmin();
  if (!auth.ok) return { error: auth.error };
  if (!ALLOWED_ROLES.includes(role)) return { error: "Ungültige Rolle." };

  const { error } = await admin().from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/users/${userId}`);
  revalidatePath("/portal/admin/users");
  return { success: true };
}

export async function updateUserStatus(userId: string, status: string) {
  const auth = await ensureAdmin();
  if (!auth.ok) return { error: auth.error };
  if (!ALLOWED_STATUS.includes(status)) return { error: "Ungültiger Status." };

  const { error } = await admin().from("profiles").update({ status }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/users/${userId}`);
  revalidatePath("/portal/admin/users");
  return { success: true };
}

export async function updateUserManager(userId: string, managerId: string | null) {
  const auth = await ensureAdmin();
  if (!auth.ok) return { error: auth.error };

  // Validierung: managerId muss existieren UND role manager/admin sein
  if (managerId !== null) {
    const { data: mgr } = await admin()
      .from("profiles")
      .select("id, role")
      .eq("id", managerId)
      .maybeSingle();
    if (!mgr) return { error: "Manager nicht gefunden." };
    if (!["manager", "admin"].includes(mgr.role)) {
      return { error: "Diese Person ist kein Manager." };
    }
    // Self-Assign vermeiden
    if (managerId === userId) {
      return { error: "Creator kann nicht sein eigener Manager sein." };
    }
  }

  const { error } = await admin()
    .from("profiles")
    .update({ manager_id: managerId })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/users/${userId}`);
  revalidatePath("/portal/admin/users");
  return { success: true };
}
