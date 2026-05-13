// Event-Cover-Upload — Admin-only (requireAdmin).
// Path: event-covers/<timestamp>-<rand>.<ext>
// POST mit multipart/form-data, file-Field. Antwort: { success, url }.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB reichen fuer Cover (3000x1300 jpg)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  // KEIN requireAdmin() — das ruft redirect() auf und liefert 307/HTML,
  // wodurch der Client-fetch().json() silent crasht. Stattdessen
  // expliziter Auth-Check mit JSON-Antwort.
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!prof || (prof.role !== "admin" && prof.role !== "manager")) {
    return NextResponse.json({ error: "Nur Admin oder Manager." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Kein File uebergeben." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Datei zu gross. Max 8 MB." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Nur JPEG, PNG oder WebP erlaubt." }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${Date.now()}-${rand}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("event-covers")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload-Fehler: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("event-covers").getPublicUrl(path);
  return NextResponse.json({ success: true, url: publicUrl });
}
