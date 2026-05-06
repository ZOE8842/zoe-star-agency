import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung gemäß § 5 DDG",
};

export default function ImpressumPage() {
  return (
    <article>
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="heading-display text-4xl md:text-5xl mb-12 text-cream">Impressum</h1>

      {/* BRAND-PROMINENT BLOCK */}
      <section className="mb-12 pb-10 border-b border-champagne/15">
        <p className="eyebrow mb-3">Betreiber</p>
        <h2 className="heading-display text-3xl md:text-4xl text-champagne mb-6">
          ZOE <span className="text-champagne/70">⭐</span> Star Agency
        </h2>
        <div className="text-cream/80 text-sm leading-relaxed space-y-1">
          <p>c/o SourceArt</p>
          <p>Tuttlingerstraße 45</p>
          <p>78333 Stockach</p>
          <p>Deutschland</p>
        </div>
      </section>

      <Section title="Kontakt">
        <p>
          E-Mail: <a href="mailto:info@zoe-star.de" className="text-champagne hover:underline">info@zoe-star.de</a><br />
          Web: zoe-star.de
        </p>
      </Section>

      <Section title="Umsatzsteuer-Identifikationsnummer">
        <p>USt-IdNr. nach § 27a UStG: <span className="text-cream">DE461789258</span></p>
      </Section>

      <Section title="Verantwortlich für redaktionelle Inhalte nach § 18 Abs. 2 MStV">
        <p className="text-cream/60">Andreea Schütz · Anschrift wie oben</p>
      </Section>

      <Section title="Streitschlichtung">
        <p>
          Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-champagne hover:underline">
            ec.europa.eu/consumers/odr
          </a>.
          Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </Section>

      <Section title="Haftung für Inhalte">
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
          Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </p>
      </Section>

      <Section title="Haftung für Links">
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
          Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht.
          Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
        </p>
      </Section>

      <p className="text-cream/40 text-xs mt-12">Stand: 6. Mai 2026</p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display italic text-xl text-champagne mb-4">{title}</h2>
      <div className="text-cream/70 leading-relaxed text-sm">{children}</div>
    </section>
  );
}
