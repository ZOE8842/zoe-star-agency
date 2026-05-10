// /api/zoe-app/request-code — Creator fordert Verbindungscode an.
// Setzt alte pending Codes auf expired, generiert neuen 6-Char-Code,
// speichert via Service-Role (RLS-Insert ist locked fuer authenticated).
// Code-Lebenszeit: 24h. Status: pending → used | expired.

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODE_TTL_HOURS = 24;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ohne 0/O/I/1, lesefreundlich
const CODE_LENGTH = 6;

function generateCode(): string {
  let out = "";
  const arr = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(arr);
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[arr[i] % ALPHABET.length];
  }
  return out;
}

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  // Profile holen — brauchen tiktok_username fuer den Code-Eintrag
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("tiktok_username, role, onboarding_completed")
    .eq("id", user.id)
    .single();
  if (pErr || !profile) {
    return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
  }
  if (!profile.tiktok_username) {
    return NextResponse.json(
      { error: "TikTok-Username fehlt im Profil." },
      { status: 400 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Alte pending Codes des Users auf expired setzen
  await admin
    .from("zoe_app_connection_codes")
    .update({ status: "expired" })
    .eq("profile_id", user.id)
    .eq("status", "pending");

  // Neuer Code, kollisionssicher (max 5 Versuche)
  let code = generateCode();
  let inserted = null;
  const expires_at = new Date(Date.now() + CODE_TTL_HOURS * 3600 * 1000).toISOString();

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin
      .from("zoe_app_connection_codes")
      .insert({
        profile_id: user.id,
        tiktok_username: profile.tiktok_username,
        code,
        expires_at,
      })
      .select("id, code, expires_at, created_at")
      .single();
    if (!error) { inserted = data; break; }
    if (error.code === "23505") {
      code = generateCode(); // unique-violation, neu wuerfeln
      continue;
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!inserted) {
    return NextResponse.json({ error: "Code-Generation fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    code: inserted.code,
    expires_at: inserted.expires_at,
    created_at: inserted.created_at,
  });
}
