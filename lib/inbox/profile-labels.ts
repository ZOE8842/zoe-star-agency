// Bypassed RLS-Lookup fuer Profile-Labels (display_name + role + tiktok_username).
// Profiles-RLS erlaubt SELECT nur fuer eigenes Profil + admin/manager.
// Inbox + Group-Chat brauchen aber Labels von allen Beteiligten — der
// Creator soll sehen "ZOE Management" / "Nina" / "@nina7vie" usw.
//
// Service-Role-Client liest nur display_name, tiktok_username, role.
// Keine PII (Email, Phone etc.) wird zurueckgegeben.

import { createClient } from "@supabase/supabase-js";

export interface ProfileLabel {
  id: string;
  display_name: string;
  tiktok_username: string | null;
  role: string;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function loadProfileLabels(ids: string[]): Promise<Map<string, ProfileLabel>> {
  const map = new Map<string, ProfileLabel>();
  const filtered = Array.from(new Set(ids.filter((id) => !!id)));
  if (filtered.length === 0) return map;
  const sb = admin();
  const { data } = await sb
    .from("profiles")
    .select("id, display_name, tiktok_username, role")
    .in("id", filtered);
  for (const p of data ?? []) {
    map.set(p.id, {
      id: p.id,
      display_name: p.display_name,
      tiktok_username: p.tiktok_username,
      role: p.role,
    });
  }
  return map;
}

// Helper fuer Inbox-Labels: Admin/Manager → "ZOE Management",
// sonst display_name. Optional mit "@username"-Hint.
export function formatPartnerLabel(p: ProfileLabel | undefined, opts?: { withHandle?: boolean }): string {
  if (!p) return "—";
  if (p.role === "admin" || p.role === "manager") return "ZOE Management";
  const base = p.display_name || "Creator";
  if (opts?.withHandle && p.tiktok_username) return `${base} · @${p.tiktok_username}`;
  return base;
}
