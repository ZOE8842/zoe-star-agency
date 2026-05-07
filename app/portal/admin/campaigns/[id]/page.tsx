import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CampaignStatusToggle } from "./CampaignStatusToggle";
import { CreatorAssign } from "./CreatorAssign";

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  paused: "Pausiert",
  completed: "Abgeschlossen",
  archived: "Archiv",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireManagerOrAdmin();
  const isAdmin = profile.role === "admin";

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) notFound();

  // Manager-Scope: nur eigene Kampagnen
  if (!isAdmin && campaign.manager_id !== profile.id) {
    notFound();
  }

  // Zugewiesene Creator
  const { data: assignedRows } = await supabase
    .from("campaign_creators")
    .select("creator_id, joined_at")
    .eq("campaign_id", id);

  const assignedIds = (assignedRows || []).map((r) => r.creator_id);
  let assignedCreators: { id: string; display_name: string; tiktok_username: string }[] = [];
  if (assignedIds.length > 0) {
    const { data: creators } = await supabase
      .from("profiles")
      .select("id, display_name, tiktok_username")
      .in("id", assignedIds);
    assignedCreators = creators || [];
  }

  // Verfuegbare Creator zum Zuweisen
  let availableQ = supabase
    .from("profiles")
    .select("id, display_name, tiktok_username")
    .eq("role", "creator")
    .eq("status", "active")
    .order("display_name", { ascending: true });

  if (!isAdmin) {
    availableQ = availableQ.eq("manager_id", profile.id);
  }

  const { data: availableCreators } = await availableQ;
  const notYetAssigned = (availableCreators || []).filter((c) => !assignedIds.includes(c.id));

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16 md:py-24 max-w-2xl mx-auto">
        <Link
          href="/portal/admin/campaigns"
          className="inline-flex items-center gap-2 text-cream/40 hover:text-champagne text-[10px] uppercase tracking-[0.3em] mb-16 transition-colors"
        >
          <span aria-hidden="true">←</span> Campaigns
        </Link>

        {/* Meta */}
        <div className="mb-8 flex items-center gap-5 text-[10px] uppercase tracking-[0.3em]">
          <span className="text-champagne">{STATUS_LABEL[campaign.status] || campaign.status}</span>
          {campaign.brand && (
            <>
              <span className="text-cream/25">·</span>
              <span className="text-cream/40">{campaign.brand}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display italic text-cream text-[40px] sm:text-5xl md:text-6xl leading-[1.0] tracking-[-0.02em] mb-16">
          {campaign.title}
        </h1>

        {/* Brief */}
        {campaign.brief && (
          <section className="mb-16">
            <p className="eyebrow mb-5">Brief</p>
            <p className="text-cream/85 text-base md:text-lg leading-[1.85] whitespace-pre-wrap font-light">
              {campaign.brief}
            </p>
          </section>
        )}

        {/* Mood */}
        {campaign.mood_url && (
          <section className="mb-16">
            <p className="eyebrow mb-5">Mood</p>
            <a
              href={campaign.mood_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cream/70 hover:text-champagne text-base font-light leading-relaxed underline-offset-4 hover:underline transition-colors break-all"
            >
              {campaign.mood_url}
            </a>
          </section>
        )}

        {/* Deliverables */}
        {campaign.deliverables && (
          <section className="mb-16">
            <p className="eyebrow mb-5">Deliverables</p>
            <p className="text-cream/85 text-base leading-[1.85] whitespace-pre-wrap font-light">
              {campaign.deliverables}
            </p>
          </section>
        )}

        {/* Zeitraum */}
        {(campaign.start_at || campaign.end_at) && (
          <section className="mb-16">
            <p className="eyebrow mb-5">Zeitraum</p>
            <p className="text-cream/70 text-base leading-relaxed font-light">
              {campaign.start_at ? formatDate(campaign.start_at) : "offen"}
              {" — "}
              {campaign.end_at ? formatDate(campaign.end_at) : "offen"}
            </p>
          </section>
        )}

        {/* Creator-Zuweisung */}
        <section className="border-t border-cream/[0.05] pt-12 mb-16">
          <p className="eyebrow mb-8">Creator</p>
          <CreatorAssign
            campaignId={campaign.id}
            assigned={assignedCreators}
            available={notYetAssigned}
          />
        </section>

        {/* Status-Toggle */}
        <section className="border-t border-cream/[0.05] pt-12">
          <p className="eyebrow mb-8">Status</p>
          <CampaignStatusToggle campaignId={campaign.id} currentStatus={campaign.status} />
        </section>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-cream/[0.05] text-cream/30 text-[10px] uppercase tracking-[0.3em]">
          Angelegt {formatDate(campaign.created_at)}
        </div>
      </main>
    </>
  );
}
