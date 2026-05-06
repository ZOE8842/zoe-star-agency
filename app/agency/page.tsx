import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Agency",
  description: "Creator-Management auf höchstem Niveau. Wir bauen die nächste Generation von TikTok-Marken — strategisch, redaktionell, profitabel.",
};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="Agency"
      title="Premium Creator Agency"
      subtitle="Creator-Management auf höchstem Niveau. Wir bauen die nächste Generation von TikTok-Marken — strategisch, redaktionell, profitabel."
      applyCta
    />
  );
}