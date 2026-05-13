// Showcase-Image-Upload — V2 unterstuetzt 2 Bild-Slots.
// Path: <user.id>/showcase_<position>.<ext> (1 oder 2)
// POST mit multipart/form-data, file-Field, position-Field (1|2 default 1)

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB · High-Quality Showcase
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const positionRaw = formData.get("position");
  const position = positionRaw === "2" ? 2 : 1;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Kein File uebergeben." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Datei zu gross. Max 20 MB." }, { status: 400 });
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
  const path = `${user.id}/showcase_${position}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from("showcase-images")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload-Fehler: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from("showcase-images").getPublicUrl(path);
  const urlWithBuster = `${publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ success: true, position, showcase_image: urlWithBuster });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
  }

  const url = new URL(req.url);
  const positionParam = url.searchParams.get("position");
  const position = positionParam === "2" ? 2 : positionParam === "1" ? 1 : null;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  if (position) {
    // einzelnes Bild loeschen
    const candidates = [
      `${user.id}/showcase_${position}.jpg`,
      `${user.id}/showcase_${position}.png`,
      `${user.id}/showcase_${position}.webp`,
    ];
    await admin.storage.from("showcase-images").remove(candidates);
  } else {
    // alle eigenen Bilder loeschen
    const { data: files } = await admin.storage.from("showcase-images").list(user.id);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("showcase-images").remove(paths);
    }
  }

  return NextResponse.json({ success: true });
}
