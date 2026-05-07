import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ComposeForm } from "./ComposeForm";

export default async function ComposePage() {
  const { supabase, profile } = await getAuthedProfile();

  // Recipient ermitteln: Manager wenn vorhanden, sonst erster Admin
  let recipientId: string | null = null;
  let recipientName = "ZOE Star Agency";

  if (profile.manager_id) {
    const { data: manager } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", profile.manager_id)
      .maybeSingle();
    if (manager) {
      recipientId = manager.id;
      recipientName = manager.display_name;
    }
  }

  if (!recipientId) {
    const { data: admin } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("role", "admin")
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (admin) {
      recipientId = admin.id;
      recipientName = admin.display_name;
    }
  }

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16 md:py-24 max-w-2xl mx-auto">
        <Link
          href="/portal/inbox"
          className="inline-flex items-center gap-2 text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.3em] mb-16 transition-colors"
        >
          <span aria-hidden="true">←</span> Inbox
        </Link>

        <p className="eyebrow mb-4">Verfassen</p>
        <h1 className="font-display italic text-cream text-3xl md:text-5xl leading-[1.05] tracking-[-0.015em] mb-12">
          Nachricht verfassen.
        </h1>

        <p className="text-cream/45 text-sm mb-16">
          An <span className="text-cream/70">{recipientName}</span>
        </p>

        {recipientId ? (
          <ComposeForm recipientId={recipientId} recipientName={recipientName} />
        ) : (
          <p className="text-cream/40 text-sm">
            Aktuell ist kein Empfänger zugewiesen. Schreib direkt an{" "}
            <a href="mailto:info@zoe-star.de" className="text-champagne hover:underline">
              info@zoe-star.de
            </a>
            .
          </p>
        )}
      </main>
    </>
  );
}
