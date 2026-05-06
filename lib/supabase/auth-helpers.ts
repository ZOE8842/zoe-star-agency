// Auth-Helper für Server-Components
// Holt User + Profile in einem Call und redirected wenn nötig.

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function getAuthedProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    // Profile existiert nicht → korrupter State, ausloggen
    await supabase.auth.signOut();
    redirect("/portal/login?error=profile_missing");
  }

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const auth = await getAuthedProfile();
  if (auth.profile.role !== "admin") redirect("/portal");
  return auth;
}
