import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="container-luxe pt-32 pb-24 max-w-3xl mx-auto">
        {children}
      </main>
      <Footer />
    </>
  );
}
