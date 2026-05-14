import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Events",
  description: "Live-Events, Ranking-Formate und Live-Touren. Showcase für die ZOE Roster.",
  alternates: { canonical: "/events" },
};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="Events"
      title="Live Formats Ranking-Shows"
      subtitle="Live-Events, Ranking-Formate und Live-Touren. Showcase für die ZOE Roster."
      
    />
  );
}