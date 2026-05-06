import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes von ZOE Star Agency. Creator-Industry, Insights, Interviews. Bald verfügbar.",
};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="Journal"
      title="ZOE Journal"
      subtitle="Notes von ZOE Star Agency. Creator-Industry, Insights, Interviews. Bald verfügbar."
      
    />
  );
}