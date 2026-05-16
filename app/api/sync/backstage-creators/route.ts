// GET /api/sync/backstage-creators
// Liefert dem Workstation-Scraper die aktuelle Creator-Liste (nur normalisierte
// Handles, keine PII). Auth via gleichem BACKSTAGE_SYNC_BEARER wie der
// Push-Endpoint. So bleibt die Service-Role NIEMALS auf der Workstation und
// neue onboardete Creator werden automatisch ab dem nächsten Daily-Run
// mitgescraped — kein manuelles TXT-Pflegen.
//
// Filter:
//   role = 'creator'
//   status = 'active'
//   onboarding_completed = true
//   tiktok_handle_normalized IS NOT NULL
//   ausschluss: 'ray_star_agency' (User-Decision, dauerhaft excluded)
//
// Response:
//   { handles: ["angelikakarmyshova", "charlize_nk", …], count: 23, excluded: ["ray_star_agency"] }

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSrClient } from "@supabase/supabase-js";
import { checkSyncAuth } from "@/lib/security/sync-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXCLUDED_HANDLES = new Set<string>(["ray_star_agency"]);

function srClient() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET(request: NextRequest) {
  const authResp = checkSyncAuth(request);
  if (authResp) return authResp;

  try {
    const sb = srClient();
    const { data, error } = await sb
      .from("profiles")
      .select("tiktok_handle_normalized")
      .eq("role", "creator")
      .eq("status", "active")
      .eq("onboarding_completed", true)
      .not("tiktok_handle_normalized", "is", null)
      .order("tiktok_handle_normalized", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `db_read_failed: ${error.message}` },
        { status: 500 },
      );
    }

    const all: string[] = (data ?? [])
      .map((r) => (r.tiktok_handle_normalized as string | null) ?? "")
      .filter((h) => h.length > 0);

    const excluded: string[] = [];
    const handles = all.filter((h) => {
      if (EXCLUDED_HANDLES.has(h)) {
        excluded.push(h);
        return false;
      }
      return true;
    });

    return NextResponse.json({
      handles,
      count: handles.length,
      excluded,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
