import Link from "next/link";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CampaignForm } from "./CampaignForm";

export default async function NewCampaignPage() {
  const { profile } = await requireManagerOrAdmin();

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16 md:py-24 max-w-2xl mx-auto">
        <Link
          href="/portal/admin/campaigns"
          className="inline-flex items-center gap-2 text-cream/40 hover:text-champagne text-[10px] uppercase tracking-[0.3em] mb-16 transition-colors"
        >
          <span aria-hidden="true">←</span> Campaigns
        </Link>

        <p className="eyebrow mb-4">Neue Kampagne</p>
        <h1 className="font-display italic text-cream text-3xl md:text-5xl leading-[1.05] tracking-[-0.015em] mb-12">
          Wie soll diese Kampagne wirken?
        </h1>

        <CampaignForm />
      </main>
    </>
  );
}
