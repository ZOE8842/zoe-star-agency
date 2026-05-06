import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { DownloadUploader } from "./DownloadUploader";

export default async function AdminDownloadsPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: downloads } = await supabase
    .from("downloads")
    .select("id, title, category, file_url, file_size, file_type, visible_to_role, uploaded_at")
    .order("uploaded_at", { ascending: false });

  return (
    <>
      <PortalNav displayName={profile.display_name} email={profile.email} isAdmin />
      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Admin · Downloads</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Asset <span className="text-champagne">library.</span>
        </h1>

        <DownloadUploader adminId={profile.id} />

        <div className="mt-16 mb-6">
          <p className="eyebrow">Library ({downloads?.length || 0})</p>
        </div>

        <div className="border border-champagne/15 overflow-hidden">
          <table className="w-full">
            <thead className="bg-champagne/5">
              <tr className="text-left">
                <Th>Title</Th>
                <Th>Category</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Visibility</Th>
                <Th>Uploaded</Th>
              </tr>
            </thead>
            <tbody>
              {downloads?.map((d) => (
                <tr key={d.id} className="border-t border-champagne/10 hover:bg-champagne/5">
                  <td className="px-4 py-3 text-sm">
                    <a href={d.file_url} target="_blank" rel="noopener" className="text-cream hover:text-champagne">
                      {d.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-cream/60 text-xs uppercase tracking-[0.2em]">{d.category}</td>
                  <td className="px-4 py-3 text-cream/50 text-xs">{d.file_type || "—"}</td>
                  <td className="px-4 py-3 text-cream/50 text-xs">{d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : "—"}</td>
                  <td className="px-4 py-3 text-cream/50 text-xs">{d.visible_to_role || "all"}</td>
                  <td className="px-4 py-3 text-cream/40 text-xs">{new Date(d.uploaded_at).toLocaleDateString("de-DE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-champagne font-medium">
      {children}
    </th>
  );
}
