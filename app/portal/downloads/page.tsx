import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

const categoryLabels: Record<string, string> = {
  logo: "Logos",
  image: "Images",
  video: "Videos",
  template: "Templates",
  pdf: "PDFs",
  guide: "Guides",
  other: "Other",
};

export default async function DownloadsPage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: downloads } = await supabase
    .from("downloads")
    .select("id, title, description, category, file_url, file_size, file_type, tags, uploaded_at")
    .order("uploaded_at", { ascending: false });

  // Gruppiere nach Kategorie
  const grouped: Record<string, typeof downloads> = {};
  (downloads || []).forEach((d) => {
    if (!grouped[d.category]) grouped[d.category] = [];
    grouped[d.category]!.push(d);
  });

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Asset Library</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-4">
          Brand <span className="text-champagne">downloads.</span>
        </h1>
        <p className="text-cream/60 text-sm mb-12">Logos, templates, and brand assets — everything you need.</p>

        {(!downloads || downloads.length === 0) && (
          <div className="border border-champagne/15 p-10 text-center">
            <p className="text-cream/40 text-sm">No downloads yet — admin will upload soon.</p>
          </div>
        )}

        {Object.entries(grouped).map(([cat, files]) => (
          <section key={cat} className="mb-12">
            <p className="eyebrow mb-5">{categoryLabels[cat] || cat}</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files?.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener"
                  className="group border border-champagne/15 p-5 hover:border-champagne hover:bg-champagne/5 transition-all"
                >
                  <h3 className="font-display italic text-lg text-cream group-hover:text-champagne mb-2">
                    {file.title}
                  </h3>
                  {file.description && (
                    <p className="text-cream/50 text-xs mb-4 line-clamp-2">{file.description}</p>
                  )}
                  <div className="flex items-center justify-between text-cream/40 text-[10px] uppercase tracking-[0.2em]">
                    <span>{file.file_type || cat}</span>
                    {file.file_size && <span>{(file.file_size / 1024).toFixed(0)} KB</span>}
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
