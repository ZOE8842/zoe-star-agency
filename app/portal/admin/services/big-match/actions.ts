"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth-helpers";

const ALLOWED_STATUSES = [
  "requested", "in_review", "partner_found", "scheduled", "done", "rejected",
] as const;

export async function updateBigMatch(input: {
  id: string;
  status?: (typeof ALLOWED_STATUSES)[number];
  admin_note?: string;
  scheduled_for?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, profile } = await requireAdmin();

  const update: Record<string, unknown> = {
    reviewed_by: profile.id,
    reviewed_at: new Date().toISOString(),
  };

  if (input.status) {
    if (!ALLOWED_STATUSES.includes(input.status)) {
      return { ok: false, error: "Ungueltiger Status." };
    }
    update.status = input.status;
  }

  if (input.admin_note !== undefined) {
    update.admin_note = (input.admin_note || "").trim().slice(0, 1000) || null;
  }

  if (input.scheduled_for !== undefined) {
    update.scheduled_for = input.scheduled_for;
  }

  const { error } = await supabase
    .from("match_requests")
    .update(update)
    .eq("id", input.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/admin/services/big-match");
  revalidatePath(`/portal/admin/services/big-match/${input.id}`);
  revalidatePath("/portal/services/big-match");
  return { ok: true };
}
