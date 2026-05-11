import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ChallengeForm } from "./ChallengeForm";

export const dynamic = "force-dynamic";

export default async function NewChallengePage() {
  const { profile } = await requireAdmin();
  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin
      />
      <main className="container-luxe py-12 md:py-16 max-w-2xl">
        <div className="mb-8">
          <Link href="/portal/admin/challenges" className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em]">
            ← Challenges
          </Link>
        </div>
        <p className="eyebrow mb-3">Admin · Academy</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Neue <span className="text-champagne">Challenge.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Klare Aufgabe, klares Ende, klarer Reward. Sofort aktivieren =
          alle aktiven Creator bekommen einen Inbox-Hinweis.
        </p>
        <ChallengeForm />
      </main>
    </>
  );
}
