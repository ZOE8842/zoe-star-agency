// /portal/services — Creator Services Hub V1
// 6 Cards, in Vorbereitung. Einzelne Module folgen in Phase B-D.

import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

interface ServiceCard {
  title: string;
  short: string;
  description: string;
  badge: "aktiv" | "naechste" | "vorbereitung";
  href?: string;
}

const SERVICES: ServiceCard[] = [
  {
    title: "TikTok Push",
    short: "Wunschzeiten fuer LIVE-Traffic",
    description:
      "Melde deine geplanten LIVE-Zeiten fuer moeglichen TikTok-Traffic an. Immer fuer die naechste Woche, max drei Wuensche.",
    badge: "aktiv",
    href: "/portal/services/tiktok-push",
  },
  {
    title: "Telefon-Termin",
    short: "Rueckruf vom Management",
    description:
      "Wenn du was besprechen willst — Rueckruf-Fenster waehlen, wir melden uns ueber den Kanal deiner Wahl.",
    badge: "vorbereitung",
  },
  {
    title: "LIVE-Abmeldung",
    short: "Krank, Technik, privat",
    description:
      "Sauber abmelden wenn du nicht live gehen kannst. Grund + Zeitraum reichen — kein langer Brief noetig.",
    badge: "vorbereitung",
  },
  {
    title: "Big Match Partner",
    short: "Anfrage fuer staerkere Battles",
    description:
      "Match-Partner fuer groessere Battles oder besondere Streams anfragen. Wir suchen passende Gegner.",
    badge: "vorbereitung",
  },
  {
    title: "Content Helfer",
    short: "Video- und Profil-Feedback",
    description:
      "Reiche Video oder Link ein, wir analysieren Hook, Schnitt, Licht, TikTok-Tauglichkeit und konkrete Verbesserungen.",
    badge: "vorbereitung",
  },
  {
    title: "Support",
    short: "Echte Probleme, keine DMs",
    description:
      "Account-, LIVE- oder Portal-Probleme bekommen ein Ticket. Damit nichts in DMs verloren geht.",
    badge: "vorbereitung",
  },
];

const BADGE_STYLES: Record<ServiceCard["badge"], string> = {
  aktiv: "bg-champagne text-ink",
  naechste: "border border-champagne/60 text-champagne",
  vorbereitung: "border border-champagne/35 text-champagne/85",
};

const BADGE_LABEL: Record<ServiceCard["badge"], string> = {
  aktiv: "Aktiv",
  naechste: "Kommt als Naechstes",
  vorbereitung: "In Vorbereitung",
};

export default async function ServicesHubPage() {
  const { profile } = await getAuthedProfile();

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

      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="container-luxe relative z-10 py-12 md:py-16 max-w-3xl">
        <p className="eyebrow mb-3">Creator Services</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Alles, was du <span className="text-champagne">brauchst.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-xl">
          LIVE-Push, Termine, Match-Partner und Content-Feedback — gebuendelt
          an einem Ort. Wir bauen die Module Schritt fuer Schritt sauber aus.
        </p>

        <div className="grid gap-3 md:gap-4">
          {SERVICES.map((s) => {
            const inner = (
              <>
                <div className="flex items-baseline justify-between gap-3 mb-2.5">
                  <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight">
                    {s.title}
                  </h2>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] ${BADGE_STYLES[s.badge]}`}
                  >
                    {BADGE_LABEL[s.badge]}
                  </span>
                </div>
                <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-3">
                  {s.short}
                </p>
                <p className="text-cream/65 text-sm md:text-base leading-relaxed">
                  {s.description}
                </p>
              </>
            );
            if (s.href) {
              return (
                <Link
                  key={s.title}
                  href={s.href}
                  className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
                >
                  {inner}
                  <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
                    Oeffnen →
                  </p>
                </Link>
              );
            }
            return (
              <article
                key={s.title}
                className="border border-champagne/15 p-5 md:p-6"
              >
                {inner}
              </article>
            );
          })}
        </div>

        <p className="text-cream/35 text-xs mt-12 leading-relaxed">
          Bei Fragen oder Wuenschen melde dich beim Management.
          Wir bauen die Services so, dass sie fuer dich passen.
        </p>
      </main>
    </>
  );
}
