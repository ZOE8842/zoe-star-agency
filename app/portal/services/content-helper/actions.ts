"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertSafeUrl } from "@/lib/security/safe-fetch";

interface SubmitInput {
  kind: "video_link" | "video_file" | "image" | "profile";
  source_url?: string;
  video_storage_path?: string;
  manual_note?: string;
}

const ALLOWED_KINDS = ["video_link", "video_file", "image", "profile"] as const;

function trim(v: string | undefined, max: number): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, max);
}

export async function submitContent(input: SubmitInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  if (!ALLOWED_KINDS.includes(input.kind)) {
    return { ok: false, error: "Kind ungueltig." };
  }

  const source_url = trim(input.source_url, 500);
  const video_storage_path = trim(input.video_storage_path, 500);
  const manual_note = trim(input.manual_note, 500);

  // Mindestens eins von beiden muss da sein (DB-Check)
  if (!source_url && !video_storage_path) {
    return { ok: false, error: "Bitte Link oder Datei angeben." };
  }
  if (source_url) {
    // SSRF-Schutz: blockiert nicht-https, private-IPs, link-local,
    // metadata-Endpoints, .local/.internal.
    const safe = assertSafeUrl(source_url);
    if (!safe.ok) {
      return { ok: false, error: `Link ungueltig: ${safe.error}` };
    }
  }

  // Rate-Limit: max 5 offene Jobs pro Creator
  const { count: openJobs } = await supabase
    .from("content_reviews")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .in("status", ["submitted", "queued", "processing"]);

  if ((openJobs ?? 0) >= 5) {
    return {
      ok: false,
      error: "Du hast bereits 5 offene Anfragen. Bitte warte bis welche abgeschlossen sind.",
    };
  }

  const { data, error } = await supabase
    .from("content_reviews")
    .insert({
      profile_id: user.id,
      kind: input.kind,
      source_url,
      video_url: input.kind === "video_link" ? source_url : null,
      video_storage_path,
      manual_note,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/services/content-helper");
  revalidatePath(`/portal/services/content-helper/${data.id}`);
  return { ok: true, id: data.id };
}
