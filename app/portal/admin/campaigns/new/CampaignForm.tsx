"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "../actions";

export function CampaignForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [brief, setBrief] = useState("");
  const [moodUrl, setMoodUrl] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 2) {
      setError("Bitte einen Titel angeben.");
      return;
    }
    setLoading(true);
    const res = await createCampaign({
      title: title.trim(),
      brand: brand.trim() || undefined,
      brief: brief.trim() || undefined,
      moodUrl: moodUrl.trim() || undefined,
      deliverables: deliverables.trim() || undefined,
      startAt: startAt || undefined,
      endAt: endAt || undefined,
    });
    setLoading(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    if ("id" in res && res.id) {
      router.push(`/portal/admin/campaigns/${res.id}`);
      router.refresh();
    } else {
      router.push("/portal/admin/campaigns");
    }
  }

  const labelCls = "block text-[10px] uppercase tracking-[0.3em] text-cream/35 mb-4";
  const inputCls =
    "w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-3 text-cream/85 text-base focus:outline-none placeholder-cream/20 transition-colors";

  return (
    <form onSubmit={submit} className="space-y-12">
      <div>
        <label htmlFor="title" className={labelCls}>Titel</label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Wie heißt diese Kampagne?"
          className={`${inputCls} font-display italic text-2xl md:text-3xl leading-tight tracking-[-0.01em]`}
        />
      </div>

      <div>
        <label htmlFor="brand" className={labelCls}>Marke (optional)</label>
        <input
          id="brand"
          type="text"
          maxLength={100}
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Brand-Name"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="brief" className={labelCls}>Brief</label>
        <textarea
          id="brief"
          rows={8}
          maxLength={10000}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Worum geht es? Welche Tonalität, welche Stimmung, welche Botschaft?"
          className={`${inputCls} leading-[1.75] font-light resize-none md:text-lg`}
        />
      </div>

      <div>
        <label htmlFor="moodUrl" className={labelCls}>Mood-Link (optional)</label>
        <input
          id="moodUrl"
          type="url"
          maxLength={500}
          value={moodUrl}
          onChange={(e) => setMoodUrl(e.target.value)}
          placeholder="https://… Pinterest, Are.na, Notion-Board"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="deliverables" className={labelCls}>Deliverables (optional)</label>
        <textarea
          id="deliverables"
          rows={5}
          maxLength={10000}
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
          placeholder="Was wird produziert? In welcher Form, in welchem Format?"
          className={`${inputCls} leading-[1.75] font-light resize-none`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <label htmlFor="startAt" className={labelCls}>Start (optional)</label>
          <input
            id="startAt"
            type="date"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="endAt" className={labelCls}>Ende (optional)</label>
          <input
            id="endAt"
            type="date"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <div className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/portal/admin/campaigns")}
          className="text-cream/45 hover:text-cream text-[11px] uppercase tracking-[0.3em] transition-colors px-4 py-3"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "Erstelle…" : "Kampagne anlegen"}
        </button>
      </div>
    </form>
  );
}
