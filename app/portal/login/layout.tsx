import type { Metadata } from "next";

// Eigener Tab-Titel fuer die Login-Seite. page.tsx ist eine Client-Component
// und kann selbst kein metadata exportieren — ohne dieses Layout stand im Tab
// der Startseiten-Titel "ZOE Star Agency · Premium Talent · Media · …".
export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
