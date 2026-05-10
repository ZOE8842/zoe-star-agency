import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { SubmitForm } from "./SubmitForm";

export const dynamic = "force-dynamic";

export default async function ContentHelperNewPage() {
  const { profile } = await getAuthedProfile();

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
            href="/portal/services/content-helper"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Content Helfer
          </Link>
        </div>

        <p className="eyebrow mb-3">Neue Anfrage</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Was sollen wir <span className="text-champagne">analysieren?</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Video, Bild oder Link. Wir schauen Hook, Aufbau, Licht, Ton,
          TikTok-Tauglichkeit + geben konkrete Schritte.
        </p>

        <SubmitForm />
      </main>
    </>
  );
}
