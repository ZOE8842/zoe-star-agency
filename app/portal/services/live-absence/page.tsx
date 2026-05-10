import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AbsenceForm } from "./AbsenceForm";

export const dynamic = "force-dynamic";

export default async function LiveAbsencePage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: history } = await supabase
    .from("live_absences")
    .select("id, reason, period_start, period_end, status, note, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

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

        <p className="eyebrow mb-3">LIVE-Abmeldung</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Wenn was <span className="text-champagne">dazwischen kommt.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Sag uns kurz Bescheid, wenn du nicht LIVE gehen kannst. Krank,
          Technik, TikTok-Sperre, privat — Hauptsache wir wissen es.
        </p>

        <AbsenceForm history={history ?? []} />
      </main>
    </>
  );
}
