import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Media",
  description: "Brand-Kooperationen, redaktionelle Kampagnen und Content-Produktion. Premium-Production für moderne Marken.",
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