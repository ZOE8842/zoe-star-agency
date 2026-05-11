// Interest-Flow · Creator akzeptiert/lehnt Showcase und Kooperation ab.
// Status-Werte: pending | accepted | declined
//
// Beim accept wird zusaetzlich das alte allow_*-Flag gesetzt (Backwards-
// Compat fuer Consent-Flow + Mail-Bestaetigung).

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InterestKind = "showcase" | "cooperation";
export type InterestStatus = "pending" | "accepted" | "declined";

export async function setInterestStatus(
  kind: InterestKind,
  status: InterestStatus,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const update: Record<string, unknown> = {};
  const nowIso = new Date().toISOString();
  const isAccepted = status === "accepted";
  const isPending = status === "pending";

  if (kind === "showcase") {
    update.showcase_interest_status = status;
    update.showcase_interest_decided_at = isPending ? null : nowIso;
    if (typeof note === "string") update.showcase_interest_note = note.slice(0, 500);
    // Sync dual-write: allow_*-Flag spiegelt status exakt
    update.allow_website_showcase = isAccepted;
    update.allow_website_showcase_confirmed_at = isAccepted ? nowIso : null;
  } else {
    update.cooperation_interest_status = status;
    update.cooperation_interest_decided_at = isPending ? null : nowIso;
    if (typeof note === "string") update.cooperation_interest_note = note.slice(0, 500);
    update.allow_partner_cooperations = isAccepted;
    update.allow_partner_cooperations_confirmed_at = isAccepted ? nowIso : null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) {
    if (error.code === "PGRST204" || error.message.includes("interest_status")) {
      return {
        ok: false,
        error: "Migration 0027 fehlt · Supabase-Dashboard SQL-Editor: 0027_interest_status.sql ausfuehren.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/portal");
  revalidatePath("/portal/profile");
  return { ok: true };
}
