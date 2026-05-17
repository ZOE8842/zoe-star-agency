import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { baseUrl } from "@/lib/seo/routes";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/JsonLd";
import { PublicAnalyticsTracker } from "@/components/analytics/PublicAnalyticsTracker";
import { getEffectiveLocale } from "@/lib/i18n";
import { RTL_LOCALES } from "@/lib/i18n/config";

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
  metadataBase: new URL(baseUrl()),
  title: {
    default: "ZOE Star Agency · Premium Talent · Media · Entertainment",
    template: "%s · ZOE Star Agency",
  },
  description:
    "Premium Creator Talent Agency. ZOE Star Agency baut die nächste Generation von Creator-Marken — mit redaktioneller Präzision, Business-Tiefe und globalem Anspruch.",
  applicationName: "ZOE Star Agency",
  keywords: [
    "ZOE Star Agency",
    "TikTok Agency",
    "Creator Management",
    "Talent Agency",
    "Live Creator",
    "Deutschland",
  ],
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "ZOE Star Agency",
    title: "ZOE Star Agency · Premium Talent · Media · Entertainment",
    description:
      "Premium Creator Talent Agency — multi-vertical brand für Talent, Media, Events und Studio.",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZOE Star Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZOE Star Agency",
    description: "Premium Creator Talent Agency",
    images: ["/brand/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-512.png", sizes: "512x512" }],
  },
  alternates: {
    canonical: "/",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // iPhone-Notch + Home-Indicator nutzen
  themeColor: "#0a0a0a",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // i18n: lang + dir-Attribut basierend auf Effective-Locale.
  // - Eingeloggt: profiles.language
  // - Nicht eingeloggt: Cookie zoe_public_lang → Accept-Language → 'de'
  const locale = await getEffectiveLocale();
  const dir = RTL_LOCALES.has(locale) ? "rtl" : "ltr";
  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-ink text-cream antialiased">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <PublicAnalyticsTracker />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
