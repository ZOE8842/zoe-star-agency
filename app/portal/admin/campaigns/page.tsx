import Link from "next/link";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  active: "Aktiv",
  paused: "Pausiert",
  completed: "Abgeschlossen",
  archived: "Archiv",
};

interface Campaign {
  id: string;
  title: string;
  brand: string | null;
  status: string;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  manager_id: string | null;
}

export default async function CampaignsPage() {
  const { supabase, profile } = await requireManagerOrAdmin();
  const isAdmin = profile.role === "admin";

  let campaigns: Campaign[] = [];
  let schemaMissing = false;

  let q = supabase
    .from("campaigns")
    .select("id, title, brand, status, start_at, end_at, created_at, manager_id")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    q = q.eq("manager_id", profile.id);
  }

  const { data, error } = await q;
  if (error) {
    schemaMissing = true;
  } else {
    campaigns = (data || []) as Campaign[];
  }

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

      <main className="container-luxe py-16 md:py-24 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <p className="eyebrow mb-4">{isAdmin ? "Kampagnen" : "Meine Kampagnen"}</p>
            <h1 className="font-display italic text-cream text-5xl md:text-7xl leading-[0.95] tracking-[-0.02em]">
              Campaigns.
            </h1>
          </div>
          <Link
            href="/portal/admin/campaigns/new"
            className="shrink-0 mt-3 text-cream/60 hover:text-champagne text-[10px] uppercase tracking-[0.3em] inline-flex items-center min-h-[40px] px-3 border border-cream/15 hover:border-champagne transition"
          >
            Neue Kampagne
          </Link>
        </div>
        <p className="text-cream/45 text-sm mb-20">
          {campaigns.length} {campaigns.length === 1 ? "Kampagne" : "Kampagnen"}
        </p>

        {schemaMissing && (
          <div className="border-l-2 border-champagne/40 pl-4 mb-12">
            <p className="text-cream/60 text-sm leading-relaxed">
              Schema noch nicht migriert. Bitte SQL aus
              <code className="text-champagne mx-1">scripts/setup_campaigns.py</code>
              im Supabase Dashboard ausführen.
            </p>
          </div>
        )}

        {campaigns.length === 0 && !schemaMissing && (
          <div className="py-20 text-center">
            <p className="font-display italic text-cream/30 text-2xl">
              Noch keine Kampagne angelegt.
            </p>
          </div>
        )}

        <ul className="divide-y divide-cream/[0.05]">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/portal/admin/campaigns/${c.id}`}
                className="group block py-7 md:py-8 transition-colors hover:bg-cream/[0.015]"
              >
                <div className="flex items-baseline gap-4 mb-3 text-[10px] uppercase tracking-[0.25em]">
                  <span className="text-champagne">{STATUS_LABEL[c.status] || c.status}</span>
                  {c.brand && <span className="text-cream/40">{c.brand}</span>}
                </div>
                <h2 className="font-display italic text-cream text-2xl md:text-3xl mb-3 leading-tight tracking-[-0.01em] group-hover:text-champagne transition-colors">
                  {c.title}
                </h2>
                <p className="text-cream/30 text-[10px] uppercase tracking-[0.25em]">
                  {c.start_at
                    ? `Start ${new Date(c.start_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}`
                    : `Angelegt ${new Date(c.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
