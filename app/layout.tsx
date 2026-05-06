import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://zoe-star.de"),
  title: {
    default: "ZOE Star Agency · Premium Talent · Media · Entertainment",
    template: "%s · ZOE Star Agency",
  },
  description: "Premium Creator Talent Agency. Building a multi-vertical brand for talent, media, fashion, and entertainment.",
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "ZOE Star Agency",
    title: "ZOE Star Agency · Premium Talent · Media · Entertainment",
    description: "Premium Creator Talent Agency. Building a multi-vertical brand.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-ink text-cream antialiased">{children}</body>
    </html>
  );
}
