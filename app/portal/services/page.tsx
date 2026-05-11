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
  badge: "aktiv";
  href: string;
}

const SERVICES: ServiceCard[] = [
  {
    title: "Big Match",
    short: "ZOE organisiert starke Matches",
    description:
      "Datum, Level, Ziel — wir suchen den Gegner. Agencygefuehrt, kein Self-Service.",
    badge: "aktiv",
    href: "/portal/services/big-match",
  },
  {
    title: "TikTok Push",
    short: "Wunschzeiten fuer LIVE-Traffic",
    description:
      "Geplante LIVE-Zeiten anmelden. Naechste Woche, max drei Wuensche.",
    badge: "aktiv",
    href: "/portal/services/tiktok-push",
  },
  {
    title: "Telefon-Termin",
    short: "Rueckruf vom Management",
    description:
      "Rueckruf-Fenster waehlen. Wir melden uns ueber deinen Kanal.",
    badge: "aktiv",
    href: "/portal/services/phone-request",
  },
  {
    title: "LIVE-Abmeldung",
    short: "Krank, Technik, privat",
    description:
      "Grund + Zeitraum reichen. Kein langer Brief noetig.",
    badge: "aktiv",
    href: "/portal/services/live-absence",
  },
  {
    title: "Content Helfer",
    short: "Video- und Profil-Feedback",
    description:
      "Hook, Schnitt, Licht, Ton — und was dir noch fehlt.",
    badge: "aktiv",
    href: "/portal/services/content-helper",
  },
];

const BADGE_STYLES: Record<ServiceCard["badge"], string> = {
  aktiv: "bg-champagne text-ink",
};

const BADGE_LABEL: Record<ServiceCard["badge"], string> = {
  aktiv: "Aktiv",
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
          Deine <span className="text-champagne">Tools.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-xl">
          Alles Operative mit ZOE — an einem Ort.
        </p>

        <div className="grid gap-3 md:gap-4">
          {SERVICES.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-colors block group"
            >
              <div className="flex items-baseline justify-between gap-3 mb-2.5">
                <h2 className="font-display italic text-cream text-xl md:text-2xl leading-tight">
                  {s.title}
                </h2>
                <span className={`shrink-0 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.25em] ${BADGE_STYLES[s.badge]}`}>
                  {BADGE_LABEL[s.badge]}
                </span>
              </div>
              <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-3">
                {s.short}
              </p>
              <p className="text-cream/65 text-sm md:text-base leading-relaxed">
                {s.description}
              </p>
              <p className="mt-3 text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:text-champagne-300">
                →
              </p>
            </Link>
          ))}
        </div>

        <p className="text-cream/35 text-xs mt-12 leading-relaxed">
          Fragen? Schreib dem <Link href="/portal/support" className="text-cream/55 hover:text-champagne">Support</Link>.
        </p>
      </main>
    </>
  );
}
