import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Header />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-ink overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-champagne/10 via-transparent to-transparent" />
        </div>

        <div className="container-luxe relative z-10 pt-32 pb-24">
          <div className="max-w-4xl">
            <p className="eyebrow mb-8 animate-fade-in">A new era for creators</p>
            <h1 className="heading-display text-[64px] md:text-[96px] lg:text-[128px] leading-[0.95] mb-10 text-cream animate-fade-up">
              Premium Talent.<br />
              Media.<br />
              <span className="text-champagne">Entertainment.</span>
            </h1>
            <p className="text-cream/70 text-xl md:text-2xl leading-relaxed max-w-2xl mb-12">
              ZOE Star Agency builds the next generation of creator-led brands —
              with editorial precision, business depth, and global ambition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/join" className="btn-primary">Join as Talent</Link>
              <Link href="/contact" className="btn-outline">Partner with ZOE</Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-cream/40 text-[10px] uppercase tracking-[0.4em]">
          Scroll
        </div>
      </section>

      {/* MANIFEST */}
      <section className="bg-cream text-ink py-32">
        <div className="container-luxe text-center max-w-3xl mx-auto">
          <p className="eyebrow mb-8">Our manifest</p>
          <p className="font-display italic font-black text-3xl md:text-5xl leading-tight text-ink">
            We don&apos;t build a TikTok agency.
            <br />
            We build the stage where premium talent becomes a brand.
          </p>
          <div className="hairline mx-auto mt-12" />
        </div>
      </section>

      {/* CATEGORY GATEWAY */}
      <section className="bg-ink py-32">
        <div className="container-luxe">
          <p className="eyebrow text-center mb-4">Where we operate</p>
          <h2 className="heading-display text-4xl md:text-6xl text-center text-cream mb-20">
            Four <span className="text-champagne">verticals.</span>
            <br />
            One brand.
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Agency", desc: "Creator management & talent representation", href: "/agency" },
              { title: "Media", desc: "Brand campaigns & content production", href: "/media" },
              { title: "Events", desc: "Live formats & ranking shows", href: "/events" },
              { title: "Studio", desc: "Original IP & format development", href: "/studio" },
            ].map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="group border border-champagne/20 p-10 transition-all duration-500 hover:border-champagne hover:bg-champagne/5"
              >
                <p className="eyebrow mb-6">{cat.title}</p>
                <h3 className="font-display italic font-black text-3xl text-cream mb-4 group-hover:text-champagne transition-colors">
                  {cat.title}
                </h3>
                <p className="text-cream/60 text-sm leading-relaxed">{cat.desc}</p>
                <span className="inline-block mt-8 text-champagne text-[10px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA-FOOTER */}
      <section className="bg-ink py-32 border-t border-champagne/10">
        <div className="container-luxe text-center max-w-2xl mx-auto">
          <p className="eyebrow mb-8">Ready</p>
          <h2 className="heading-display text-4xl md:text-6xl text-cream mb-10">
            Become part of the <span className="text-champagne">roster.</span>
          </h2>
          <Link href="/join" className="btn-primary">Apply now</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
