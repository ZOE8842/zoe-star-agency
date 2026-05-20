"use server";

import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { revalidatePath } from "next/cache";
import { invalidateShowcase } from "@/lib/showcase/invalidation";

type Kind = "showcase" | "cooperation";
type Status = "pending" | "accepted" | "declined";

export async function adminSetInterest(
  userId: string,
  kind: Kind,
  status: Status,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, profile: admin } = await requireManagerOrAdmin();
  if (admin.role !== "admin") return { ok: false, error: "Nur Admin." };

  const update: Record<string, unknown> = {};
  const nowIso = new Date().toISOString();
  const isAccepted = status === "accepted";
  const isPending = status === "pending";

  if (kind === "showcase") {
    update.showcase_interest_status = status;
    update.showcase_interest_decided_at = isPending ? null : nowIso;
    update.allow_website_showcase = isAccepted;
    update.allow_website_showcase_confirmed_at = isAccepted ? nowIso : null;
  } else {
    update.cooperation_interest_status = status;
    update.cooperation_interest_decided_at = isPending ? null : nowIso;
    update.allow_partner_cooperations = isAccepted;
    update.allow_partner_cooperations_confirmed_at = isAccepted ? nowIso : null;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) {
    if (error.code === "PGRST204" || error.message.includes("interest_status")) {
      return {
        ok: false,
        error: "Migration 0027 fehlt · Supabase-Dashboard SQL-Editor: 0027_interest_status.sql ausfuehren.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/portal/admin/users/${userId}`);
  // CDX-1: Admin-Eingriff in Creator-Interest beruehrt allow_*-Felder
  // und damit Public-Visibility. Cache invalidieren.
  await invalidateShowcase();
  return { ok: true };
}
