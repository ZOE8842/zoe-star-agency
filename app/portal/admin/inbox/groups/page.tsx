import Link from "next/link";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  group: "Gruppe",
  channel: "Channel",
  event: "Event",
  dm: "DM",
};

export default async function AdminGroupsPage() {
  const { supabase, profile } = await requireManagerOrAdmin();

  const { data: rows } = await supabase
    .from("conversations")
    .select("id, type, title, created_by, created_at, last_message_at")
    .in("type", ["group", "channel", "event"])
    .order("last_message_at", { ascending: false, nullsFirst: false });

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
      <main className="container-luxe py-12 md:py-16 max-w-3xl">
        <div className="flex items-baseline justify-between gap-3 mb-8 flex-wrap">
          <div>
            <p className="eyebrow mb-3">Admin · Inbox</p>
            <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em]">
              Gruppen.
            </h1>
          </div>
          <Link
            href="/portal/admin/inbox/groups/new"
            className="btn-cta btn-shimmer"
          >
            Neue Gruppe
            <span className="btn-cta-arrow" aria-hidden>→</span>
          </Link>
        </div>

        <p className="text-cream/55 text-sm mb-10 max-w-xl">
          Gruppen-Threads fuer Creator-Community, Events, Big-Match und intern.
          Direct-Messages bleiben unveraendert im Postfach.
        </p>

        {(rows?.length ?? 0) === 0 && (
          <div className="border border-champagne/15 p-8 text-center">
            <p className="font-display italic text-cream/45 text-xl mb-2">
              Noch keine Gruppen.
            </p>
            <p className="text-cream/35 text-sm">
              Erste Gruppe anlegen → Mitglieder waehlen → fertig.
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {(rows ?? []).map((c) => (
            <li key={c.id}>
              <Link
                href={`/portal/admin/inbox/groups/${c.id}`}
                className="block border border-champagne/15 hover:border-champagne/50 hover:bg-champagne/5 p-4 md:p-5 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                  <p className="font-display italic text-cream text-lg md:text-xl">{c.title}</p>
                  <span className="text-cream/40 text-[10px] uppercase tracking-[0.25em] shrink-0">
                    {TYPE_LABEL[c.type] ?? c.type}
                  </span>
                </div>
                <p className="text-cream/35 text-[10px] uppercase tracking-[0.22em]">
                  {c.last_message_at
                    ? `Letzte Nachricht ${new Date(c.last_message_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}`
                    : "Noch keine Nachricht"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
