import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ComposeForm, type RecipientOption } from "./ComposeForm";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const { supabase, profile } = await getAuthedProfile();
  const isAdmin = profile.role === "admin" || profile.role === "manager";

  let defaultRecipientId: string | null = null;
  let defaultRecipientName = "ZOE Star Agency";
  let creatorOptions: RecipientOption[] | undefined;

  if (isAdmin) {
    // Admin/Manager: alle aktiven Creator als Picker-Optionen
    const { data: creators } = await supabase
      .from("profiles")
      .select("id, display_name, tiktok_username")
      .eq("role", "creator")
      .eq("status", "active")
      .order("display_name", { ascending: true });
    creatorOptions = (creators ?? []).map((c) => ({
      id: c.id,
      label: c.display_name,
      hint: c.tiktok_username ? `@${c.tiktok_username}` : undefined,
    }));
  } else {
    // Creator: Manager wenn vorhanden, sonst erster Admin
    if (profile.manager_id) {
      const { data: manager } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", profile.manager_id)
        .maybeSingle();
      if (manager) {
        defaultRecipientId = manager.id;
        defaultRecipientName = manager.display_name;
      }
    }
    if (!defaultRecipientId) {
      const { data: admin } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("role", "admin")
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (admin) {
        defaultRecipientId = admin.id;
        defaultRecipientName = admin.display_name;
      }
    }
  }

  // Admin: kann immer (Broadcast funktioniert auch ohne Creator-Liste).
  // Creator: braucht einen Default-Empfaenger.
  const canCompose = isAdmin ? true : !!defaultRecipientId;

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
          href="/portal/inbox"
          className="inline-flex items-center gap-2 text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.3em] mb-16 transition-colors"
        >
          <span aria-hidden="true">←</span> Inbox
        </Link>

        <p className="eyebrow mb-4">Verfassen</p>
        <h1 className="font-display italic text-cream text-3xl md:text-5xl leading-[1.05] tracking-[-0.015em] mb-6">
          Nachricht verfassen.
        </h1>

        {isAdmin && (
          <div className="border border-champagne/30 bg-champagne/[0.04] p-4 md:p-5 mb-10 flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-cream/70 text-sm">
              Mehrere Empfaenger gleichzeitig? Lege eine Gruppe an.
            </p>
            <Link
              href="/portal/admin/inbox/groups/new"
              className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] shrink-0"
            >
              Neue Gruppe →
            </Link>
          </div>
        )}

        {!isAdmin && (
          <p className="text-cream/45 text-sm mb-16">
            An <span className="text-cream/70">{defaultRecipientName}</span>
          </p>
        )}

        {canCompose ? (
          <ComposeForm
            recipientId={defaultRecipientId ?? ""}
            recipientName={defaultRecipientName}
            recipientOptions={creatorOptions}
            allowBroadcast={isAdmin}
          />
        ) : (
          <p className="text-cream/40 text-sm">
            {isAdmin
              ? "Keine aktiven Creator vorhanden."
              : (
                <>
                  Aktuell ist kein Empfänger zugewiesen. Schreib direkt an{" "}
                  <a href="mailto:info@zoe-star.de" className="text-champagne hover:underline">
                    info@zoe-star.de
                  </a>
                  .
                </>
              )}
          </p>
        )}
      </main>
    </>
  );
}
