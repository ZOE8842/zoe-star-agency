import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { UserActions } from "./UserActions";
import { CreatorNotes } from "./CreatorNotes";

export default async function CreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile: admin } = await requireManagerOrAdmin();

  const { data: user } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!user) notFound();

  // Manager-Scoping: nur eigene Creator. Admin sieht alles.
  if (admin.role !== "admin" && user.manager_id !== admin.id && user.id !== admin.id) {
    notFound();
  }

  // Stats parallel
  const now = new Date().toISOString();
  const [slotsRes, eventsRes, messagesRes, ticketsRes, managerRes, managersRes] = await Promise.all([
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id)
      .gte("start_at", now),
    supabase
      .from("event_signups")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
    user.manager_id
      ? supabase.from("profiles").select("display_name").eq("id", user.manager_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("profiles")
      .select("id, display_name, role")
      .in("role", ["manager", "admin"])
      .eq("status", "active")
      .order("display_name", { ascending: true }),
  ]);

  const upcomingSlots = slotsRes.count ?? 0;
  const eventSignups = eventsRes.count ?? 0;
  const messageCount = messagesRes.count ?? 0;
  const ticketCount = ticketsRes.count ?? 0;
  const managerName = managerRes.data?.display_name || null;
  const availableManagers = (managersRes.data || []).filter((m) => m.id !== user.id);

  // Creator-Notes laden — graceful falls Tabelle fehlt
  type Note = {
    id: string;
    body: string;
    created_at: string;
    updated_at: string | null;
    author_id: string;
    author_name?: string;
  };
  let notes: Note[] = [];
  const { data: rawNotes, error: notesErr } = await supabase
    .from("creator_notes")
    .select("id, body, created_at, updated_at, author_id")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  if (!notesErr && rawNotes) {
    // Author-Names parallel
    const authorIds = Array.from(new Set(rawNotes.map((n) => n.author_id)));
    const { data: authors } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", authorIds);
    const authorMap = new Map((authors || []).map((a) => [a.id, a.display_name]));
    notes = rawNotes.map((n) => ({ ...n, author_name: authorMap.get(n.author_id) }));
  }

  return (
    <>
      <PortalNav
        userId={admin.id}
        displayName={admin.display_name}
        email={admin.email}
        avatarUrl={admin.avatar_url}
        isAdmin
      />

      <main className="container-luxe py-16 md:py-24 max-w-3xl mx-auto">
        <Link
          href="/portal/admin/users"
          className="inline-flex items-center gap-2 text-cream/40 hover:text-champagne text-[10px] uppercase tracking-[0.3em] mb-16 transition-colors"
        >
          <span aria-hidden="true">←</span> Roster
        </Link>

        {/* Header */}
        <header className="flex items-start gap-6 mb-16">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt=""
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-champagne/30 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-champagne/10 border border-champagne/30 flex items-center justify-center text-champagne text-3xl font-display italic shrink-0">
              {(user.display_name || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-3">Roster · {user.role}</p>
            <h1 className="font-display italic text-cream text-3xl md:text-5xl leading-[1.05] tracking-[-0.015em]">
              {user.display_name}
            </h1>
            <p className="text-cream/55 text-sm mt-3">
              @{user.tiktok_username} · {user.email}
            </p>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-cream/[0.05] mb-16">
          <Stat label="Push-Wuensche" value={upcomingSlots} hint="diese Woche" />
          <Stat label="Events" value={eventSignups} hint="Anmeldungen" />
          <Stat label="Inbox" value={messageCount} hint="erhalten" />
          <Stat label="Tickets" value={ticketCount} hint="alle" />
        </section>

        {/* Profil-Daten */}
        <section className="mb-16">
          <p className="eyebrow mb-6">Profil</p>
          <dl className="space-y-4 text-sm">
            <Row label="Email" value={user.email} />
            <Row label="TikTok" value={`@${user.tiktok_username}`} />
            <Row label="Status" value={user.status} />
            <Row label="Role" value={user.role} />
            <Row label="Manager" value={managerName || "—"} />
            <Row label="Land" value={user.country || "—"} />
            <Row label="Sprache" value={user.language?.toUpperCase() || "—"} />
            <Row
              label="Beigetreten"
              value={new Date(user.joined_at).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
            {user.last_active_at && (
              <Row
                label="Letzte Aktivität"
                value={new Date(user.last_active_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </dl>
        </section>

        {user.bio && (
          <section className="mb-16">
            <p className="eyebrow mb-4">Bio</p>
            <p className="text-cream/75 text-base leading-[1.85] font-light whitespace-pre-wrap">
              {user.bio}
            </p>
          </section>
        )}

        {/* Aktionen — Admin-only */}
        {admin.role === "admin" && (
          <section className="border-t border-cream/[0.05] pt-12">
            <p className="eyebrow mb-8">Aktionen</p>
            <UserActions
              userId={user.id}
              currentRole={user.role}
              currentStatus={user.status}
              currentManagerId={user.manager_id}
              availableManagers={availableManagers}
            />
          </section>
        )}

        {/* Akte — interne Manager-Notes */}
        <section className="border-t border-cream/[0.05] pt-12 mt-16">
          <p className="eyebrow mb-8">Akte</p>
          <CreatorNotes
            creatorId={user.id}
            currentUserId={admin.id}
            isAdmin={admin.role === "admin"}
            notes={notes}
          />
        </section>
      </main>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="bg-ink p-5 md:p-6">
      <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em] mb-3">{label}</p>
      <p className="font-display italic text-cream text-3xl mb-1">{value}</p>
      <p className="text-cream/30 text-[10px] uppercase tracking-[0.25em]">{hint}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-cream/[0.04] pb-3">
      <dt className="text-cream/40 text-[10px] uppercase tracking-[0.25em] shrink-0">{label}</dt>
      <dd className="text-cream/80 font-mono text-sm text-right truncate">{value}</dd>
    </div>
  );
}
