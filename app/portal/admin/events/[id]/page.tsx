import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { EventForm, type EventInitial } from "../EventForm";
import { StatusActions } from "./StatusActions";
import { DeleteEventButton } from "./DeleteEventButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEventEditPage({ params }: Props) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, category, source, start_at, end_at, max_participants, status, cover_image_url, prize_description, registration_url, rules, visibility_mode, requires_registration",
    )
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();

  const [{ count: signupCount }, { data: allowedRows }, { data: creators }] = await Promise.all([
    supabase
      .from("event_signups")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id)
      .in("status", ["signed", "confirmed"]),
    supabase
      .from("event_allowed_profiles")
      .select("profile_id")
      .eq("event_id", id),
    supabase
      .from("profiles")
      .select("id, display_name, tiktok_username")
      .eq("role", "creator")
      .eq("status", "active")
      .order("display_name", { ascending: true }),
  ]);

  const allowedIds = (allowedRows ?? []).map((r) => r.profile_id);
  const creatorOptions = (creators ?? []).map((c) => ({
    id: c.id,
    label: c.display_name,
    hint: c.tiktok_username ? `@${c.tiktok_username}` : undefined,
  }));

  const initial: EventInitial = {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    category: event.category,
    source: event.source ?? "agency",
    start_at: event.start_at,
    end_at: event.end_at ?? null,
    max_participants: event.max_participants ?? null,
    prize_description: event.prize_description ?? null,
    registration_url: event.registration_url ?? null,
    rules: event.rules ?? null,
    cover_image_url: event.cover_image_url ?? null,
    status: event.status,
    visibility_mode: (event.visibility_mode as "all" | "selected" | null) ?? "all",
    allowed_profile_ids: allowedIds,
    requires_registration: event.requires_registration ?? true,
  };

  return (
    <>
      <PortalNav userId={profile.id}
        displayName={profile.display_name} email={profile.email}
        avatarUrl={profile.avatar_url} isAdmin />
      <main className="container-luxe py-12 md:py-16">
        <div className="mb-8 flex items-baseline justify-between gap-3 flex-wrap">
          <Link
            href="/portal/admin/events"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Alle Events
          </Link>
          <Link
            href={`/portal/events/${event.id}`}
            className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
          >
            Vorschau →
          </Link>
        </div>

        <p className="eyebrow mb-3">Admin · Event bearbeiten</p>
        <h1 className="heading-display text-3xl md:text-4xl mb-3">
          {event.title}
        </h1>
        <p className="text-cream/45 text-sm mb-12">
          {signupCount ?? 0} Anmeldungen
          {event.max_participants ? ` · ${event.max_participants} Plaetze` : ""}
        </p>

        <section className="border border-champagne/15 p-6 md:p-7 mb-8">
          <p className="eyebrow mb-4">Status</p>
          <StatusActions eventId={event.id} current={event.status} />
        </section>

        <EventForm initial={initial} creators={creatorOptions} />

        <section className="border border-red-500/20 p-6 md:p-7 mt-12">
          <p className="eyebrow mb-2 text-red-300/80">Gefahrenzone</p>
          <p className="text-cream/55 text-sm mb-4 leading-relaxed">
            Event hart loeschen. Anmeldungen + Berechtigungen werden mitgeloescht. Cover-Bild bleibt im Storage.
          </p>
          <DeleteEventButton eventId={event.id} title={event.title} />
        </section>
      </main>
    </>
  );
}
