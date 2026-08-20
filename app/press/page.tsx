import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Press",
  description: "Presseanfragen, Interviews, Pressefotos. Wir freuen uns auf Anfragen.",
  alternates: { canonical: "/press" },
  // Teaser-Seite ohne echten Inhalt: erreichbar, aber nicht indexieren.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Press · ZOE Star Agency",
    description: "Presseanfragen, Interviews, Pressefotos. Wir freuen uns auf Anfragen.",
    url: "/press",
  },
  twitter: {
    title: "Press · ZOE Star Agency",
    description: "Presseanfragen, Interviews, Pressefotos. Wir freuen uns auf Anfragen.",
  },

};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="Press"
      title="Press Media-Kit"
      subtitle="Presseanfragen, Interviews, Pressefotos. Wir freuen uns auf Anfragen."
      
    />
  );
}