import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export default async function InfoPage() {
  const { profile } = await getAuthedProfile();

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16 max-w-3xl mx-auto">
        <p className="eyebrow mb-3">Info</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Rules <span className="text-champagne">·</span> Live-Tipps <span className="text-champagne">·</span> Best Practices
        </h1>

        <Section title="LIVE-Tag · Eligibility">
          <ul className="space-y-3 text-cream/70 leading-relaxed">
            <li>· Mindestens <strong className="text-cream">20 Stunden</strong> live in den letzten 8 Tagen</li>
            <li>· Verteilung über <strong className="text-cream">mindestens 7 Tage</strong></li>
            <li>· Pro Tag mindestens 1 valid LIVE-Stunde</li>
            <li>· LIVE-Tag gilt für 24h ab Vergabe — verschwindet wenn Kriterien nicht mehr erfüllt</li>
          </ul>
        </Section>

        <Section title="Erste 15 Minuten · Live-Start">
          <ul className="space-y-3 text-cream/70 leading-relaxed">
            <li>· Pünktlicher Start (Slot-Anmeldung verbindlich)</li>
            <li>· Direkt aktiv sein — keine AFK-Phase, kein Schweigen</li>
            <li>· Begrüßung mit Namen wenn neue Zuschauer kommen</li>
            <li>· Klare Story / Aktion in den ersten 5 Minuten</li>
            <li>· Niemals leeren Bildschirm zeigen, niemals weggehen</li>
          </ul>
        </Section>

        <Section title="Matches · Battles">
          <ul className="space-y-3 text-cream/70 leading-relaxed">
            <li>· Match-Partner mit ähnlichem Level wählen</li>
            <li>· Community vor dem Match aktivieren</li>
            <li>· Klare Match-Regel ankündigen</li>
            <li>· Nach Match: Energie halten, Zuschauer nicht verlieren</li>
          </ul>
        </Section>

        <Section title="Community-Regeln">
          <ul className="space-y-3 text-cream/70 leading-relaxed">
            <li>· Respekt vor Zuschauern und anderen Creatorn</li>
            <li>· Keine Drama-Calls, keine öffentlichen Konflikte</li>
            <li>· Toxische Kommentare moderieren oder bannen</li>
            <li>· Kein Spam-Pingen anderer Creator ohne Absprache</li>
          </ul>
        </Section>

        <Section title="TikTok TOS · Was nicht erlaubt ist">
          <ul className="space-y-3 text-cream/70 leading-relaxed">
            <li>· Keine externen Plattform-Empfehlungen (kein Instagram-/Discord-Spam)</li>
            <li>· Keine Verkaufs-Pitches außerhalb TikTok-Shop</li>
            <li>· Keine Adult-Inhalte / Suggestive Content</li>
            <li>· Keine Glücksspiel-Inhalte oder Money-Promises</li>
          </ul>
        </Section>

        <Section title="ZOE-Agency-Standards">
          <ul className="space-y-3 text-cream/70 leading-relaxed">
            <li>· Slot-Anmeldungen sind verbindlich — Reschedule mind. 6h vorher</li>
            <li>· Pflicht-Nachrichten innerhalb 12h bestätigen</li>
            <li>· Bei Fragen: Support-Ticket, kein DM-Chaos</li>
            <li>· Manager-Kommunikation in der Inbox, nicht über externe Kanäle</li>
          </ul>
        </Section>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 pb-12 border-b border-champagne/10 last:border-b-0">
      <h2 className="font-display italic text-2xl text-champagne mb-6">{title}</h2>
      {children}
    </section>
  );
}
