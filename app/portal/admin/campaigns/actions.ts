"use server";

import { createClient as createSrvClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ALLOWED_STATUS = ["draft", "active", "paused", "completed", "archived"];

async function ensureManagerOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return { ok: false, error: "Keine Berechtigung." };
  }
  return { ok: true, userId: user.id, role: profile.role };
}

function admin() {
  return createSrvClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

interface CreateArgs {
  title: string;
  brand?: string;
  brief?: string;
  moodUrl?: string;
  deliverables?: string;
  startAt?: string;
  endAt?: string;
  managerId?: string;
}

export async function createCampaign(args: CreateArgs) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };
  if (!args.title || args.title.trim().length < 2) return { error: "Titel zu kurz." };
  if (args.title.length > 200) return { error: "Titel zu lang." };

  const managerId = args.managerId || auth.userId;

  const { data, error } = await admin()
    .from("campaigns")
    .insert({
      title: args.title.trim(),
      brand: args.brand?.trim() || null,
      brief: args.brief?.trim() || null,
      mood_url: args.moodUrl?.trim() || null,
      deliverables: args.deliverables?.trim() || null,
      start_at: args.startAt || null,
      end_at: args.endAt || null,
      created_by: auth.userId,
      manager_id: managerId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/portal/admin/campaigns");
  return { success: true, id: data.id };
}

export async function updateCampaignStatus(campaignId: string, status: string) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };
  if (!ALLOWED_STATUS.includes(status)) return { error: "Ungültiger Status." };

  const { error } = await admin()
    .from("campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/campaigns/${campaignId}`);
  revalidatePath("/portal/admin/campaigns");
  return { success: true };
}

export async function updateCampaignField(campaignId: string, field: string, value: string | null) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };

  const ALLOWED_FIELDS = ["title", "brand", "brief", "mood_url", "deliverables"];
  if (!ALLOWED_FIELDS.includes(field)) return { error: "Feld nicht editierbar." };

  const { error } = await admin()
    .from("campaigns")
    .update({ [field]: value || null, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/campaigns/${campaignId}`);
  return { success: true };
}

export async function attachCreator(campaignId: string, creatorId: string) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };

  const { error } = await admin()
    .from("campaign_creators")
    .insert({ campaign_id: campaignId, creator_id: creatorId });
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/campaigns/${campaignId}`);
  return { success: true };
}

export async function detachCreator(campaignId: string, creatorId: string) {
  const auth = await ensureManagerOrAdmin();
  if (!auth.ok) return { error: auth.error };

  const { error } = await admin()
    .from("campaign_creators")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("creator_id", creatorId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/campaigns/${campaignId}`);
  return { success: true };
}
