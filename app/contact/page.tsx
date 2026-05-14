import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Nimm Kontakt mit ZOE Star Agency auf — für Creator-Anfragen, Brand-Kooperationen oder allgemeine Fragen.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="container-luxe pt-32 pb-20 max-w-2xl mx-auto">
        <p className="eyebrow mb-3">Kontakt</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-6">
          Nimm <span className="text-champagne">Kontakt</span> auf.
        </h1>
        <p className="text-cream/70 text-base leading-relaxed mb-12 max-w-xl">
          Creator-Anfrage, Brand-Kooperation oder etwas anderes? Schreib uns —
          Antwort meist innerhalb von 24–48 Stunden.
        </p>

        <ContactForm />

        <p className="text-cream/45 text-xs mt-6 italic">
          Alle Anfragen werden vertraulich behandelt.
        </p>

        <div className="mt-12 pt-10 border-t border-champagne/15 text-cream/60 text-sm">
          <p>
            Direkt per Mail:{" "}
            <a
              href="mailto:info@zoe-star.de"
              className="text-champagne hover:underline"
            >
              info@zoe-star.de
            </a>
          </p>
          <p className="text-cream/40 text-xs mt-3">
            Postanschrift findest du im{" "}
            <a href="/legal/impressum" className="text-champagne/70 hover:text-champagne">Impressum</a>.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
