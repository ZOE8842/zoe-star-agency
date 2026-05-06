"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = ["logo", "image", "video", "template", "pdf", "guide", "other"] as const;

export function DownloadUploader({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<typeof categories[number]>("logo");
  const [visibleTo, setVisibleTo] = useState<"creator" | "manager" | "admin" | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Bitte Datei auswählen."); return; }
    setLoading(true); setError(null); setSuccess(false);

    const supabase = createClient();

    // 1. Upload zu Storage
    const ext = file.name.split(".").pop();
    const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const storagePath = `${category}/${Date.now()}_${safeName}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("zoe-downloads")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadErr) { setError(`Upload-Fehler: ${uploadErr.message}`); setLoading(false); return; }

    // 2. Public-URL holen
    const { data: { publicUrl } } = supabase.storage
      .from("zoe-downloads")
      .getPublicUrl(storagePath);

    // 3. DB-Eintrag
    const { error: insertErr } = await supabase.from("downloads").insert({
      title,
      description: description || null,
      category,
      file_url: publicUrl,
      file_size: file.size,
      file_type: file.type || ext,
      visible_to_role: visibleTo || null,
      uploaded_by: adminId,
    });

    if (insertErr) { setError(`DB-Fehler: ${insertErr.message}`); setLoading(false); return; }

    setTitle(""); setDescription(""); setFile(null); setVisibleTo("");
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    setSuccess(true); setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8 space-y-5">
      <p className="eyebrow mb-2">Upload asset</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Title</label>
          <input
            type="text" required value={title} maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Description (optional)</label>
          <input
            type="text" value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
          />
        </div>

        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Visibility</label>
          <select
            value={visibleTo} onChange={(e) => setVisibleTo(e.target.value as any)}
            className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base"
          >
            <option value="">All authenticated</option>
            <option value="creator">Creators only</option>
            <option value="manager">Managers + Admin</option>
            <option value="admin">Admin only</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">File</label>
          <input
            id="file-input"
            type="file" required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream file:bg-champagne file:text-ink file:border-0 file:px-3 file:py-1 file:mr-3 file:text-[10px] file:uppercase file:tracking-wider focus:border-champagne focus:outline-none"
          />
        </div>
      </div>

      <div className="border border-champagne/15 bg-champagne/5 px-4 py-3">
        <p className="text-cream/60 text-xs">
          <span className="text-champagne uppercase tracking-[0.2em] text-[10px]">Hinweis · </span>
          Storage-Bucket „zoe-downloads" muss zuerst in Supabase angelegt werden:
          Storage → Create bucket → Name <code className="text-champagne">zoe-downloads</code> → Public OFF (RLS-protected).
        </p>
      </div>

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">{error}</div>}
      {success && <div className="border border-green-500/40 bg-green-500/10 px-4 py-2 text-green-300 text-sm">Asset uploaded.</div>}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Uploading..." : "Upload asset"}
      </button>
    </form>
  );
}
