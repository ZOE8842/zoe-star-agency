"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface BigMatchInput {
  desired_date?: string | null;
  desired_time?: string | null;
  own_level: string;
  match_type: string;
  desired_opponent_level?: string | null;
  language?: string | null;
  country?: string | null;
  goal?: string | null;
  message?: string | null;
}

const OWN_LEVELS = ["Newcomer", "Aufsteiger", "Etabliert", "Top-Performer"];
const MATCH_TYPES = ["Battle", "PK", "Multi-Gast-Match", "Talk-Match"];
const OPPONENT_LEVELS = ["Aehnlich stark", "Staerker (Stretch)", "Schwaecher (Coaching)", "Egal"];
const LANGUAGES = ["Deutsch", "Englisch", "Tuerkisch", "Arabisch", "Sonstiges"];
const COUNTRIES = ["DE", "AT", "CH", "EU", "Welt"];
const GOALS = ["Diamanten", "Wachstum", "Reichweite", "Community", "Test"];

function pick(val: string | undefined | null, allowed: string[]): string | null {
  if (!val) return null;
  const v = val.trim();
  return allowed.includes(v) ? v : null;
}

export async function submitBigMatch(
  input: BigMatchInput,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  // own_level + match_type sind Pflicht und muessen in der Whitelist sein
  const own = pick(input.own_level, OWN_LEVELS);
  const type = pick(input.match_type, MATCH_TYPES);
  if (!own) return { ok: false, error: "Eigenes Level bitte aus der Liste waehlen." };
  if (!type) return { ok: false, error: "Match-Art bitte aus der Liste waehlen." };

  const opponent = pick(input.desired_opponent_level, OPPONENT_LEVELS);
  const lang = pick(input.language, LANGUAGES);
  const country = pick(input.country, COUNTRIES);
  const goal = pick(input.goal, GOALS);

  const desired_date = input.desired_date && /^\d{4}-\d{2}-\d{2}$/.test(input.desired_date) ? input.desired_date : null;
  const desired_time = (input.desired_time || "").trim().slice(0, 24) || null;
  const message = (input.message || "").trim().slice(0, 500) || null;

  // Rate-Limit: max 2 offene Anfragen pro Creator
  const { count: openCount } = await supabase
    .from("match_requests")
    .select("id", { head: true, count: "exact" })
    .eq("profile_id", user.id)
    .in("status", ["requested", "in_review", "partner_found"]);
  if ((openCount ?? 0) >= 2) {
    return { ok: false, error: "Du hast bereits 2 offene Big-Match-Anfragen. Warte bis ZOE eine geplant hat." };
  }

  const { data, error } = await supabase
    .from("match_requests")
    .insert({
      profile_id: user.id,
      desired_date,
      desired_time,
      own_level: own,
      match_type: type,
      desired_opponent_level: opponent,
      language: lang,
      country,
      goal,
      message,
      status: "requested",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/services/big-match");
  revalidatePath("/portal/services");
  return { ok: true, id: data.id };
}

export const BIG_MATCH_OPTIONS = {
  own_levels: OWN_LEVELS,
  match_types: MATCH_TYPES,
  opponent_levels: OPPONENT_LEVELS,
  languages: LANGUAGES,
  countries: COUNTRIES,
  goals: GOALS,
};
