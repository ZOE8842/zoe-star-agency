// GET /api/sync/backstage-creators
// Liefert dem Workstation-Scraper die aktuelle Creator-Liste (nur normalisierte
// Handles, keine PII). Auth via gleichem BACKSTAGE_SYNC_BEARER wie der
// Push-Endpoint. So bleibt die Service-Role NIEMALS auf der Workstation.
//
// V5-Filter (2026-05-16 · User-Decision):
//   role = 'creator'
//   status != 'deleted' (also active + inactive sind drin)
//   tiktok_handle_normalized IS NOT NULL
//   ausschluss: 'ray_star_agency' (User-Decision, dauerhaft excluded)
//
// onboarding_completed wurde RAUS aus dem Filter:
//   → Backstage-Scraper soll auch noch nicht-onboardete Creator scrapen,
//     damit das Admin-Ranking ALLE Backstage-Daten sieht.
//   → Creator-facing (eigenes Dashboard, eigene Analyse) bleibt durch
//     Login + RLS geschuetzt — der Scrape-Endpoint liefert PII-frei nur
//     Handle-Strings an den Workstation-Scraper.
//
// Response:
//   {
//     handles: ["angelika...", "charlize_nk", ...],
//     count: 32,
//     excluded: ["ray_star_agency"]
//   }

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
      .neq("status", "deleted")
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
