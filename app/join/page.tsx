import type { Metadata } from "next";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Join",
  description: "Wir suchen Creator mit einer eigenen Stimme, eigener Vision und Lust auf Wachstum. Bewerbung läuft direkt über TikTok.",
};

export default function Page() {
  return (
    <ComingSoonPage
      eyebrow="Join"
      title="Werde Teil der Roster"
      subtitle="Wir suchen Creator mit einer eigenen Stimme, eigener Vision und Lust auf Wachstum. Bewerbung läuft direkt über TikTok."
      applyCta
    />
  );
}