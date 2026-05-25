// Email-Confirm-Callback · für Supabase Magic-Link / Email-Confirm-Flow
//
// Supabase-Default-Template sendet:
//   {{ .SiteURL }}/auth/confirm?token_hash=...&type=email&next=/portal
//
// Diese Route nimmt token_hash + type entgegen, ruft verifyOtp() auf
// und redirected zur next-URL bei Erfolg. Ohne diese Route landen
// Confirm-Links auf der Hauptseite OHNE Token-Exchange → "Email not
// confirmed" beim Login.
//
// PKCE-Flow nutzt stattdessen /auth/callback (siehe ../callback/route.ts).

import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/portal";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/portal/login?error=${encodeURIComponent("Bestätigungslink unvollständig.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });
  if (error) {
    return NextResponse.redirect(
      `${origin}/portal/login?error=${encodeURIComponent("Bestätigung fehlgeschlagen: " + error.message)}`,
    );
  }

  // Erfolg · Session ist jetzt aktiv, weiter zur Ziel-URL
  return NextResponse.redirect(`${origin}${next}`);
}
