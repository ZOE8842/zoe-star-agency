import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Studio",
  description: "Eigene Formate, eigene Marken, eigene IP. Studio-Entwicklung für die nächste Generation.",
};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="Studio"
      title="Original IP Format-Entwicklung"
      subtitle="Eigene Formate, eigene Marken, eigene IP. Studio-Entwicklung für die nächste Generation."
      
    />
  );
}