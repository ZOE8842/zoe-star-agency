import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zusammenarbeit & Standards",
  description: "Hinweise zur Zusammenarbeit im ZOE-Portal — partnerschaftlich, vertraulich, professionell.",
  alternates: { canonical: "/legal/portal-regeln" },
};

export default function PortalRegelnPage() {
  return (
    <article className="prose-luxe">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="heading-display text-4xl md:text-5xl mb-12 text-cream">
        Zusammenarbeit &amp; Standards
      </h1>

      <p className="text-cream/70 text-sm mb-10 leading-relaxed">
        Diese Hinweise helfen dabei, die Zusammenarbeit zwischen Creator und ZOE⭐ Star Agency strukturiert, professionell und vertraulich zu halten. Sie ergänzen die AGB und schaffen die Basis für eine partnerschaftliche, langfristige Zusammenarbeit.
      </p>

      <Section number="01" title="LIVE-Planung &amp; Kommunikation">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Wir planen LIVE-Slots gemeinsam und respektieren beidseitig zugesagte Zeiten</li>
          <li>Bei Änderungen frühzeitig Bescheid geben — am besten direkt in der Portal-Inbox</li>
          <li>Manager-Kommunikation läuft über die Inbox, damit nichts verloren geht</li>
          <li>Pflicht-Nachrichten möglichst zeitnah bestätigen, damit gemeinsam geplant werden kann</li>
        </ul>
      </Section>

      <Section number="02" title="Content &amp; Plattform">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Wir achten gemeinsam auf die TikTok-Community-Richtlinien</li>
          <li>Hochwertige LIVE-Erlebnisse: respektvoller Umgang mit Match-Partnern, Gästen und Community</li>
          <li>Brand-Vorgaben (Logo, Hashtags, Tonalität) bei Kampagnen einhalten</li>
          <li>Bei Unsicherheiten lieber kurz beim Manager rückfragen</li>
        </ul>
      </Section>

      <Section number="03" title="Account-Sicherheit">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Dediziertes Portal-Passwort verwenden — niemals identisch mit TikTok</li>
          <li>Passwort nicht weitergeben — auch nicht an Manager</li>
          <li>Bei Verdacht auf Kompromittierung sofort melden</li>
          <li>Wir fragen niemals nach deinem Passwort</li>
        </ul>
      </Section>

      <Section number="04" title="Vertraulichkeit &amp; Vertrauen">
        <p className="mb-3">
          Interne Informationen, Creator-Daten, Vergütungen und Gespräche behandeln wir grundsätzlich vertraulich.
        </p>
        <p className="mb-3">
          Das erwarten wir auch von allen Creator, Partnern und externen Beteiligten.
        </p>
        <ul className="list-disc list-outside ml-5 space-y-2 mt-4">
          <li>Daten anderer Creator (Stats, Verträge, Vergütungen) bleiben intern</li>
          <li>Screenshots aus dem Portal nicht öffentlich teilen</li>
          <li>Themen rund um Vergütung direkt mit dem Management besprechen</li>
        </ul>
      </Section>

      <Section number="05" title="Bei Problemen">
        <p>
          Bei schweren oder wiederholten Problemen behalten wir uns vor, die Zusammenarbeit einzuschränken oder zu beenden. Im Normalfall sprechen wir Themen aber direkt und persönlich mit dir an, bevor es so weit kommt.
        </p>
      </Section>

      <p className="text-cream/40 text-xs mt-12">
        Stand: 9. Mai 2026 · Mit Anmeldung im Portal bestätigst du diese Standards.
      </p>
    </article>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 pb-10 border-b border-champagne/10 last:border-b-0">
      <div className="flex items-baseline gap-4 mb-5">
        <span className="font-display italic text-3xl text-champagne">{number}</span>
        <h2 className="font-display italic text-2xl text-cream">{title}</h2>
      </div>
      <div className="text-cream/70 leading-relaxed text-sm">{children}</div>
    </section>
  );
}
