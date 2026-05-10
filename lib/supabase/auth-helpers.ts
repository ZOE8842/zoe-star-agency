// Auth-Helper für Server-Components
// Holt User + Profile in einem Call und redirected wenn nötig.
//
// V3 Member-Onboarding-Gate:
//   - Creator ohne onboarding_completed → /portal/onboarding
//   - Admin/Manager NIE blockieren (Operative-Rollen)
//   - /portal/onboarding selbst ist whitelisted

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "./server";

const ONBOARDING_PATH = "/portal/onboarding";
const ONBOARDING_WHITELIST = [
  ONBOARDING_PATH,
  "/portal/logout",
  "/portal/profile/security",
];

async function currentPath(): Promise<string> {
  // Next.js 15: x-pathname-Header wird nicht standard gesetzt.
  // next/navigation hat kein server-side path-API. Workaround:
  // wir checken referer/x-invoke-path/x-matched-path die Next setzt.
  try {
    const h = await headers();
    return (
      h.get("x-pathname") ||
      h.get("x-invoke-path") ||
      h.get("x-matched-path") ||
      ""
    );
  } catch {
    return "";
  }
}

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

  // V3 Onboarding-Gate: nur fuer Creator (nicht admin/manager).
  // Admin/Manager wurden in Migration 0008 auf onboarding_completed=true
  // gesetzt → der Block hier ist Defense-in-Depth.
  const isCreatorRole = profile.role === "creator";
  const path = await currentPath();
  const onWhitelist = ONBOARDING_WHITELIST.some((p) => path.startsWith(p));

  if (
    isCreatorRole &&
    profile.onboarding_completed === false &&
    !onWhitelist
  ) {
    redirect(ONBOARDING_PATH);
  }

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const auth = await getAuthedProfile();
  if (auth.profile.role !== "admin") redirect("/portal");
  return auth;
}

// Manager + Admin duerfen auf Roster-/Akten-Bereiche zugreifen.
// Manager bekommt automatisch Scope auf eigene Creator (manager_id = self).
// Admin sieht alles.
export async function requireManagerOrAdmin() {
  const auth = await getAuthedProfile();
  if (!["manager", "admin"].includes(auth.profile.role)) {
    redirect("/portal");
  }
  return auth;
}
