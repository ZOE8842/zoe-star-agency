"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { queueInboxNotification, pushActivityFeed } from "@/lib/notifications/inbox";

interface ChallengeInput {
  slug: string;
  title: string;
  description: string;
  body_md?: string;
  category_slug?: string;
  reward_label?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
}

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createChallenge(
  input: ChallengeInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { supabase, profile } = await requireAdmin();

  const slug = slugify(input.slug || input.title);
  if (!slug) return { ok: false, error: "Slug oder Titel benoetigt." };
  if (!input.title?.trim() || !input.description?.trim()) {
    return { ok: false, error: "Title + Description sind Pflicht." };
  }

  const { data, error } = await supabase
    .from("academy_challenges")
    .insert({
      slug,
      title: input.title.trim().slice(0, 120),
      description: input.description.trim().slice(0, 500),
      body_md: input.body_md?.trim() || null,
      category_slug: input.category_slug || null,
      reward_label: input.reward_label?.trim().slice(0, 60) || null,
      starts_at: input.starts_at || new Date().toISOString(),
      ends_at: input.ends_at || null,
      is_active: input.is_active,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Wenn aktiv -> Push an alle aktiven Creator (gebuendelt via bundle_key='academy')
  if (input.is_active) {
    await broadcastNewChallenge(supabase, data.id, input.title);
  }

  revalidatePath("/portal/admin/challenges");
  revalidatePath("/portal/academy");
  return { ok: true, id: data.id };
}

async function broadcastNewChallenge(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  challengeId: string,
  title: string,
) {
  const { data: creators } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "creator")
    .eq("status", "active");
  for (const c of creators ?? []) {
    await queueInboxNotification(supabase, {
      user_id: c.id,
      type: "academy",
      title: `Neue Academy-Challenge: ${title}`,
      body: "Schau dir die Aufgabe an und reich deine Einsendung ein bevor die Zeit laeuft.",
      link: "/portal/academy",
      bundle_key: "academy",
    });
  }
  await pushActivityFeed(supabase, {
    type: "academy_lesson",
    headline: `Neue Challenge: ${title}`,
    extra: { challenge_id: challengeId },
  });
}

export async function updateChallenge(input: {
  id: string;
  title?: string;
  description?: string;
  body_md?: string;
  category_slug?: string | null;
  reward_label?: string | null;
  ends_at?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  const update: Record<string, unknown> = {};
  if (input.title !== undefined) update.title = input.title.trim().slice(0, 120);
  if (input.description !== undefined) update.description = input.description.trim().slice(0, 500);
  if (input.body_md !== undefined) update.body_md = input.body_md.trim() || null;
  if (input.category_slug !== undefined) update.category_slug = input.category_slug;
  if (input.reward_label !== undefined) update.reward_label = input.reward_label?.trim().slice(0, 60) || null;
  if (input.ends_at !== undefined) update.ends_at = input.ends_at;

  const { error } = await supabase.from("academy_challenges").update(update).eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/admin/challenges");
  revalidatePath(`/portal/admin/challenges/${input.id}`);
  revalidatePath("/portal/academy");
  return { ok: true };
}

export async function toggleChallengeActive(
  id: string,
  active: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  // Lese Titel fuer Broadcast
  const { data: prev } = await supabase
    .from("academy_challenges")
    .select("title, is_active")
    .eq("id", id)
    .single();
  const { error } = await supabase
    .from("academy_challenges")
    .update({ is_active: active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  // Nur Push wenn Wechsel false -> true
  if (active && prev && !prev.is_active) {
    await broadcastNewChallenge(supabase, id, prev.title);
  }
  revalidatePath("/portal/admin/challenges");
  revalidatePath(`/portal/admin/challenges/${id}`);
  revalidatePath("/portal/academy");
  return { ok: true };
}

export async function extendChallenge(
  id: string,
  newEndsAt: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("academy_challenges")
    .update({ ends_at: newEndsAt })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/admin/challenges");
  revalidatePath(`/portal/admin/challenges/${id}`);
  return { ok: true };
}

export async function reviewSubmission(input: {
  submission_id: string;
  status: "approved" | "rejected" | "winner";
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, profile } = await requireAdmin();

  const { data: prev } = await supabase
    .from("academy_challenge_submissions")
    .select("id, profile_id, challenge_id, status")
    .eq("id", input.submission_id)
    .single();
  if (!prev) return { ok: false, error: "Submission nicht gefunden." };

  const { error } = await supabase
    .from("academy_challenge_submissions")
    .update({
      status: input.status,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.submission_id);
  if (error) return { ok: false, error: error.message };

  // Bei Status-Wechsel: Push an Submitter
  if (prev.status !== input.status) {
    const { data: ch } = await supabase
      .from("academy_challenges")
      .select("title")
      .eq("id", prev.challenge_id)
      .single();
    const title = ch?.title ?? "Academy-Challenge";

    const txt = input.status === "winner"
      ? { t: `🏆 Du hast gewonnen: ${title}`, b: "Deine Einsendung wurde als Gewinner-Beitrag ausgezeichnet. +100 XP" }
      : input.status === "approved"
      ? { t: `Einsendung angenommen: ${title}`, b: "Wir haben deine Einsendung gepruefte und freigegeben. Bleibt im Pool fuer Gewinner-Auswahl." }
      : { t: `Einsendung nicht angenommen: ${title}`, b: "Diesmal hat es nicht gepasst. Du kannst beim naechsten Mal wieder einreichen." };

    await queueInboxNotification(supabase, {
      user_id: prev.profile_id,
      type: "academy",
      title: txt.t,
      body: txt.b,
      link: "/portal/academy",
    });

    if (input.status === "winner") {
      await pushActivityFeed(supabase, {
        type: "academy_winner",
        actor_id: prev.profile_id,
        headline: `Challenge-Sieger: ${title}`,
      });
    }
  }

  revalidatePath("/portal/admin/challenges");
  revalidatePath(`/portal/admin/challenges/${prev.challenge_id}`);
  revalidatePath("/portal/academy");
  return { ok: true };
}
