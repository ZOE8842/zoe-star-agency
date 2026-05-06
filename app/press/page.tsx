import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Press",
  description: "Presseanfragen, Interviews, Pressefotos. Wir freuen uns auf Anfragen.",
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