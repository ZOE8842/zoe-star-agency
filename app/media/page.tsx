import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Media",
  description: "Brand-Kooperationen, redaktionelle Kampagnen und Content-Produktion. Premium-Production für moderne Marken.",
  alternates: { canonical: "/media" },
  // Teaser-Seite ohne echten Inhalt: erreichbar, aber nicht indexieren.
  robots: { index: false, follow: true },
  openGraph: {
    title: "Media · ZOE Star Agency",
    description: "Brand-Kooperationen, redaktionelle Kampagnen und Content-Produktion. Premium-Production für moderne Marken.",
    url: "/media",
  },
  twitter: {
    title: "Media · ZOE Star Agency",
    description: "Brand-Kooperationen, redaktionelle Kampagnen und Content-Produktion. Premium-Production für moderne Marken.",
  },

};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="Media"
      title="Brand Campaigns Production"
      subtitle="Brand-Kooperationen, redaktionelle Kampagnen und Content-Produktion. Premium-Production für moderne Marken."
      
    />
  );
}