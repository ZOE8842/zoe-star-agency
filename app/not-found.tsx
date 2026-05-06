import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "404 · Page not found",
  description: "Die angeforderte Seite konnte nicht gefunden werden.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <Link href="/" className="inline-block mb-12">
          <Logo variant="avatar" className="h-20 mx-auto" />
        </Link>

        <p className="eyebrow mb-6">Error · 404</p>
        <h1 className="heading-display text-5xl md:text-7xl text-cream mb-4">
          Page <span className="text-champagne">not found.</span>
        </h1>
        <p className="text-cream/60 text-base leading-relaxed mb-12 max-w-md mx-auto">
          The page you&apos;re looking for has moved, was renamed, or never existed.
          Let&apos;s get you back to the brand.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/portal/login" className="btn-outline">Creator login</Link>
        </div>

        <div className="hairline mx-auto mt-16" />
      </div>
    </main>
  );
}
