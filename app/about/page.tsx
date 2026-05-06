import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "About",
  description: "Eine Boutique-Agency für TikTok-Creator. Premium statt Masse. Wir entwickeln langfristige Brands, keine kurzfristigen Trends.",
};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="About"
      title="Über ZOE Star Agency"
      subtitle="Eine Boutique-Agency für TikTok-Creator. Premium statt Masse. Wir entwickeln langfristige Brands, keine kurzfristigen Trends."
      
    />
  );
}