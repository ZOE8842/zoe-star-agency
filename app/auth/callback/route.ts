// PKCE-Callback · für OAuth-Flows und neuere Supabase-Email-Templates
//
// Supabase-PKCE-Template sendet:
//   {{ .SiteURL }}/auth/callback?code=...
//
// Diese Route tauscht den Code gegen eine Session via
// exchangeCodeForSession() und redirected zur next-URL.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/portal";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/portal/login?error=${encodeURIComponent("Kein Bestätigungscode im Link.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/portal/login?error=${encodeURIComponent("Bestätigung fehlgeschlagen: " + error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
