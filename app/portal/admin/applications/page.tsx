// Admin-Page: Creator-Anfragen-Verwaltung
// Liste eingehender creator_applications.
// Filter nach Status. Status- und Notiz-Update via Inline-Action.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PortalNav } from "@/components/PortalNav";
import { ApplicationsTable } from "./ApplicationsTable";

interface SearchParams { status?: string }

const STATUS_LABEL: Record<string, string> = {
  new: "Neu",
  reviewed: "Geprueft",
  contacted: "Kontaktiert",
  rejected: "Abgelehnt",
  onboarded: "Aufgenommen",
};

export default async function AdminApplicationsPage(
  { searchParams }: { searchParams: Promise<SearchParams> },
) {
  const { loadLocale } = await import("@/lib/i18n");
  const { t } = await loadLocale();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, display_name, email, avatar_url, role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") redirect("/portal");

  const filter = sp.status && Object.keys(STATUS_LABEL).includes(sp.status) ? sp.status : null;

  let q = supabase.from("creator_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter) q = q.eq("status", filter);

  const { data: applications } = await q;

  // Counts per status fuer Tab-Bar
  const { data: allForCount } = await supabase
    .from("creator_applications")
    .select("status");
  const counts: Record<string, number> = { new: 0, reviewed: 0, contacted: 0, rejected: 0, onboarded: 0 };
  let total = 0;
  for (const r of (allForCount ?? [])) {
    total++;
    if (r.status && counts[r.status] !== undefined) counts[r.status]++;
  }

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin
      />

      <main className="container-luxe py-12 md:py-20">
        <section className="mb-10">
          <p className="eyebrow mb-4">Admin</p>
          <h1 className="heading-display text-4xl md:text-5xl leading-[1.05] mb-3">
            {t("admin.applications_title")}<span className="text-champagne">.</span>
          </h1>
          <p className="text-cream/60 text-sm">
            {t("admin.applications_subtitle")} <span className="text-cream">{total}</span>.
          </p>
        </section>

        {/* Status-Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 text-xs">
          <FilterPill href="/portal/admin/applications"
            label={`Alle (${total})`} active={!filter} />
          {Object.entries(STATUS_LABEL).map(([k, l]) => (
            <FilterPill key={k}
              href={`/portal/admin/applications?status=${k}`}
              label={`${l} (${counts[k]})`}
              active={filter === k} />
          ))}
        </div>

        <ApplicationsTable applications={applications ?? []} />
      </main>
    </>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 border ${active ? "border-champagne bg-champagne/10 text-champagne" : "border-champagne/15 text-cream/60 hover:border-champagne/40 hover:text-cream"} transition-colors uppercase tracking-[0.2em] text-[10px]`}
    >
      {label}
    </Link>
  );
}
