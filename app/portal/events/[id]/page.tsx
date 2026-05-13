import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { SignupButtons } from "./SignupButtons";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  open: "Offen",
  closed: "Geschlossen",
  archived: "Beendet",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase, profile } = await getAuthedProfile();
  const isAdmin = profile.role === "admin";

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, category, source, start_at, end_at, status, max_participants, cover_image_url, prize_description, registration_url, rules, winners, created_at, requires_registration",
    )
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();

  // Drafts nur fuer Admins sichtbar
  if (event.status === "draft" && !isAdmin) notFound();

  const now = new Date();
  const isPast = event.end_at ? new Date(event.end_at) < now : false;
  const isTikTok = event.source === "tiktok";

  // Signup-Status fuer aktuellen User
  const { data: mySignup } = await supabase
    .from("event_signups")
    .select("status, signed_at")
    .eq("event_id", id)
    .eq("creator_id", profile.id)
    .maybeSingle();

  // Signup-Count
  const { count: signupCount } = await supabase
    .from("event_signups")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id)
    .in("status", ["signed", "confirmed"]);

  const signupsFull = !!(event.max_participants && (signupCount ?? 0) >= event.max_participants);
  const requiresRegistration = event.requires_registration !== false;
  const canSignup = requiresRegistration && event.status === "open" && !isPast && !isTikTok;
  const signupDisabledReason = isTikTok
    ? "TikTok-Events: Teilnahme direkt auf TikTok."
    : isPast
    ? "Event ist beendet."
    : event.status !== "open"
    ? "Event ist nicht offen."
    : signupsFull
    ? "Event ist voll."
    : undefined;

  const winners = Array.isArray(event.winners) ? event.winners as Array<{ display_name?: string; rank?: number; note?: string }> : [];

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-12 md:py-16 max-w-3xl">
        <div className="mb-8 flex items-baseline justify-between gap-3 flex-wrap">
          <Link
            href="/portal/events"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em] inline-flex items-center"
          >
            ← Events
          </Link>
          {isAdmin && (
            <Link
              href={`/portal/admin/events/${event.id}`}
              className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
            >
              Admin · Bearbeiten →
            </Link>
          )}
        </div>

        {event.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt=""
            className="w-full aspect-[16/7] object-cover border border-champagne/15 mb-8"
          />
        )}

        <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
          <p className="eyebrow">
            {isTikTok ? "TikTok Event" : "Agency Event"}
            {event.category && <> · {event.category}</>}
          </p>
          <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${
            event.status === "open" ? "bg-champagne text-ink"
            : event.status === "archived" ? "border border-cream/20 text-cream/55"
            : event.status === "draft" ? "border border-yellow-400/40 text-yellow-300"
            : "border border-champagne/40 text-champagne"
          }`}>
            {STATUS_LABEL[event.status] ?? event.status}
          </span>
        </div>

        <h1 className="font-display italic text-cream text-3xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-6">
          {event.title}
        </h1>

        <p className="text-cream/55 text-sm uppercase tracking-[0.2em] mb-8">
          {new Date(event.start_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
          {event.end_at && (
            <> — {new Date(event.end_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}</>
          )}
        </p>

        {event.description && (
          <p className="text-cream/75 text-base md:text-lg leading-relaxed mb-8 whitespace-pre-wrap">
            {event.description}
          </p>
        )}

        {event.prize_description && (
          <section className="border-l-2 border-champagne/40 pl-4 mb-8">
            <p className="eyebrow mb-2">Gewinn</p>
            <p className="text-cream/85 text-base leading-relaxed whitespace-pre-wrap">
              {event.prize_description}
            </p>
          </section>
        )}

        {event.rules && (
          <section className="border border-champagne/15 p-5 md:p-6 mb-8">
            <p className="eyebrow mb-3">Regeln</p>
            <p className="text-cream/75 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {event.rules}
            </p>
          </section>
        )}

        {/* Signup-Block — nur wenn Anmeldung erforderlich */}
        {requiresRegistration ? (
          <section className="border-t border-champagne/15 pt-8 mb-8">
            <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
              <p className="eyebrow">Teilnahme</p>
              {event.max_participants && (
                <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em]">
                  {signupCount ?? 0} / {event.max_participants} Plaetze
                </p>
              )}
            </div>

            {isTikTok ? (
              event.registration_url && !isPast ? (
                <div className="space-y-2">
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta btn-shimmer"
                  >
                    Bei TikTok anmelden
                    <span className="btn-cta-arrow" aria-hidden>↗</span>
                  </a>
                  <p className="text-cream/45 text-xs">
                    Anmeldung laeuft direkt ueber TikTok. Kein Portal-Signup noetig.
                  </p>
                </div>
              ) : (
                <p className="text-cream/45 text-sm">
                  {isPast ? "Event ist beendet." : "Kein TikTok-Anmelde-Link gesetzt."}
                </p>
              )
            ) : (
              <SignupButtons
                eventId={event.id}
                signedUp={!!mySignup}
                disabled={!canSignup || signupsFull}
                disabledReason={signupDisabledReason}
              />
            )}
          </section>
        ) : (
          <section className="border-t border-champagne/15 pt-8 mb-8">
            <p className="eyebrow mb-3">Hinweis</p>
            <p className="text-cream/70 text-sm md:text-base leading-relaxed">
              Keine Anmeldung erforderlich. Dieses Event ist eine Info / Ankuendigung.
            </p>
          </section>
        )}

        {winners.length > 0 && (
          <section className="border-t border-champagne/15 pt-8 mb-8">
            <p className="eyebrow mb-3">Gewinner</p>
            <ul className="space-y-1">
              {winners.slice(0, 20).map((w, i) => (
                <li key={i} className="text-cream/85 text-sm md:text-base">
                  {w.rank && <span className="text-champagne mr-2">#{w.rank}</span>}
                  {w.display_name || "—"}
                  {w.note && <span className="text-cream/45 text-xs ml-2">{w.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
