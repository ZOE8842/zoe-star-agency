// Avatar-Upload-API
// POST mit multipart/form-data, file-Field
// Validiert Session + Mime + Size, speichert in avatars-Bucket,
// updated profiles.avatar_url, gibt Public-URL zurueck.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  // 1. Session-Verify via SSR-Client
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  // 2. File aus FormData
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Kein File übergeben." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Datei zu groß. Max 2 MB." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Nur JPEG, PNG oder WebP erlaubt." }, { status: 400 });
  }

  // 3. Service-Role-Client fuer Storage (bypasst RLS)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // 4. Upload — Pfad: <user_id>/avatar.<ext>
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${user.id}/avatar.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload-Fehler: ${uploadErr.message}` }, { status: 500 });
  }

  // 5. Public-URL holen
  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(path);

  // Cache-Buster damit Browser neue Version lädt
  const urlWithBuster = `${publicUrl}?t=${Date.now()}`;

  // 6. profiles.avatar_url updaten
  const { error: profErr } = await admin
    .from("profiles")
    .update({ avatar_url: urlWithBuster })
    .eq("id", user.id);

  if (profErr) {
    return NextResponse.json({ error: `Profile-Update fehlgeschlagen: ${profErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, avatar_url: urlWithBuster });
}

export async function DELETE(req: NextRequest) {
  // Avatar entfernen — File loeschen + DB auf null
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Loesche alle Files im User-Folder (jpg/png/webp)
  const userFolder = `${user.id}`;
  const { data: files } = await admin.storage.from("avatars").list(userFolder);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userFolder}/${f.name}`);
    await admin.storage.from("avatars").remove(paths);
  }

  await admin.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  return NextResponse.json({ success: true });
}
