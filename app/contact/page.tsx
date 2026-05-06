import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Nimm Kontakt mit ZOE Star Agency auf — für Creator-Anfragen, Brand-Kooperationen oder allgemeine Fragen.",
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
          wir antworten innerhalb von 1–3 Werktagen.
        </p>

        <ContactForm />

        <div className="mt-16 pt-10 border-t border-champagne/15 text-cream/60 text-sm space-y-2">
          <p>
            Direkt-Email:{" "}
            <a
              href="mailto:info@zoe-star.de"
              className="text-champagne hover:underline"
            >
              info@zoe-star.de
            </a>
          </p>
          <p className="text-cream/40 text-xs leading-relaxed pt-3">
            ZOE Star Agency · c/o SourceArt · Tuttlingerstraße 45 · 78333 Stockach · Deutschland
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
