import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { nextMonday, weekKey, weekRangeLabel, dayLabel } from "@/lib/services/week";
import { PushForm, type ExistingRequest, type HistoryRow } from "./PushForm";

export const dynamic = "force-dynamic";

export default async function TikTokPushPage() {
  const { supabase, profile } = await getAuthedProfile();
  const monday = nextMonday();
  const wKey = weekKey(monday);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return {
      date: weekKey(d),
      label: dayLabel(monday, i),
    };
  });

  const { data: existingRow } = await supabase
    .from("tiktok_push_requests")
    .select("id, status, requested_slots, note, created_at")
    .eq("profile_id", profile.id)
    .eq("week_start_monday", wKey)
    .maybeSingle();

  const { data: historyRows } = await supabase
    .from("tiktok_push_requests")
    .select("id, week_start_monday, status, requested_slots, created_at")
    .eq("profile_id", profile.id)
    .neq("week_start_monday", wKey)
    .order("week_start_monday", { ascending: false })
    .limit(10);

  const existing: ExistingRequest | null = existingRow
    ? {
        id: existingRow.id,
        status: existingRow.status,
        requested_slots: (existingRow.requested_slots as ExistingRequest["requested_slots"]) ?? [],
        note: existingRow.note ?? null,
        created_at: existingRow.created_at,
      }
    : null;

  const history: HistoryRow[] = (historyRows ?? []).map((h) => ({
    id: h.id,
    week_start_monday: h.week_start_monday,
    status: h.status,
    requested_slots: (h.requested_slots as HistoryRow["requested_slots"]) ?? [],
    created_at: h.created_at,
  }));

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-2xl">
        <div className="mb-10">
          <Link
            href="/portal/services"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Creator Services
          </Link>
        </div>

        <p className="eyebrow mb-3">TikTok Push</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Deine <span className="text-champagne">Wunschzeiten.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Trag bis zu drei Wunschzeiten fuer die naechste Woche ein. Wir
          schauen sie durch und melden uns mit der Auswahl.
        </p>

        <PushForm
          weekRange={weekRangeLabel(monday)}
          weekKey={wKey}
          weekDays={weekDays}
          existing={existing}
          history={history}
        />
      </main>
    </>
  );
}
