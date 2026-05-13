"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateEvent, adminUpdateEvent } from "./actions";

const CATEGORIES = ["live", "battle", "ranking", "special", "announcement"] as const;
const SOURCES = ["agency", "tiktok"] as const;
const STATUSES = ["draft", "open", "closed", "archived"] as const;

export interface EventInitial {
  id: string;
  title: string;
  description: string | null;
  category: string;
  source: string | null;
  start_at: string;
  end_at: string | null;
  max_participants: number | null;
  prize_description: string | null;
  registration_url: string | null;
  rules: string | null;
  cover_image_url: string | null;
  status: string;
  visibility_mode?: "all" | "selected" | null;
  allowed_profile_ids?: string[];
}

export interface CreatorOption {
  id: string;
  label: string;
  hint?: string;
}

// Schneidet ISO auf "YYYY-MM-DDTHH:MM" fuer datetime-local-Input.
function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

export function EventForm({
  initial,
  creators = [],
}: {
  initial?: EventInitial;
  creators?: CreatorOption[];
}) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "live");
  const [source, setSource] = useState<string>(initial?.source ?? "agency");
  const [startLocal, setStartLocal] = useState(isoToLocal(initial?.start_at ?? null));
  const [endLocal, setEndLocal] = useState(isoToLocal(initial?.end_at ?? null));
  const [maxParticipants, setMaxParticipants] = useState<string>(
    initial?.max_participants ? String(initial.max_participants) : "",
  );
  const [prize, setPrize] = useState(initial?.prize_description ?? "");
  const [registrationUrl, setRegistrationUrl] = useState(initial?.registration_url ?? "");
  const [rules, setRules] = useState(initial?.rules ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(initial?.status ?? "open");
  const [visibilityMode, setVisibilityMode] = useState<"all" | "selected">(
    initial?.visibility_mode === "selected" ? "selected" : "all",
  );
  const [allowedIds, setAllowedIds] = useState<string[]>(initial?.allowed_profile_ids ?? []);
  const [creatorQuery, setCreatorQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredCreators = creators.filter((c) => {
    const q = creatorQuery.trim().toLowerCase();
    if (!q) return true;
    return c.label.toLowerCase().includes(q) || (c.hint ?? "").toLowerCase().includes(q);
  }).slice(0, 30);

  function toggleAllowed(id: string) {
    setAllowedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setCoverError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/events/upload-cover", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok || !data.url) {
        setCoverError(data.error ?? "Upload fehlgeschlagen.");
      } else {
        setCoverUrl(data.url);
      }
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setCoverUploading(false);
      // Input zuruecksetzen damit derselbe File erneut hochgeladen werden kann
      e.target.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const start_at = localToIso(startLocal);
    if (!start_at) {
      setError("Start-Datum ungueltig.");
      setLoading(false);
      return;
    }

    const payload = {
      title,
      description: description || null,
      category,
      source,
      start_at,
      end_at: endLocal ? localToIso(endLocal) : null,
      max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
      prize_description: prize || null,
      registration_url: registrationUrl || null,
      rules: rules || null,
      cover_image_url: coverUrl || null,
      status,
      visibility_mode: visibilityMode,
      allowed_profile_ids: visibilityMode === "selected" ? allowedIds : [],
    };

    const r = isEdit
      ? await adminUpdateEvent(initial!.id, payload)
      : await adminCreateEvent(payload);

    if (!r.ok) {
      setError(r.error ?? "Fehler beim Speichern.");
      setLoading(false);
      return;
    }

    setSuccess(isEdit ? "Event aktualisiert." : "Event angelegt.");
    setLoading(false);
    if (!isEdit) {
      setTitle("");
      setDescription("");
      setStartLocal("");
      setEndLocal("");
      setMaxParticipants("");
      setPrize("");
      setRegistrationUrl("");
      setRules("");
      setCoverUrl("");
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-8 space-y-5">
      <p className="eyebrow mb-2">{isEdit ? "Event bearbeiten" : "Event anlegen"}</p>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Titel" required full>
          <input
            type="text" required value={title} maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Beschreibung (kurz)" full>
          <textarea
            rows={3} value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls + " resize-none"}
          />
        </Field>

        <Field label="Source">
          <select value={source} onChange={(e) => setSource(e.target.value)} className={selectCls}>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Kategorie">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Start" required>
          <input
            type="datetime-local" required value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Ende (optional)">
          <input
            type="datetime-local" value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        <Field label="Max Participants (optional)">
          <input
            type="number" min={1} max={10000} value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            placeholder="leer = unbegrenzt"
            className={inputCls}
          />
        </Field>

        <Field label="Cover-Bild (optional)" full>
          <div className="space-y-3">
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="w-full max-w-md aspect-[16/7] object-cover border border-champagne/20"
              />
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center px-4 py-2 border border-champagne/40 text-champagne text-[10px] uppercase tracking-[0.25em] cursor-pointer hover:bg-champagne/10 transition-colors">
                {coverUploading ? "Laedt hoch…" : coverUrl ? "Bild ersetzen" : "Bild hochladen"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  disabled={coverUploading}
                  className="hidden"
                />
              </label>
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  className="text-cream/45 hover:text-red-300 text-[10px] uppercase tracking-[0.25em]"
                >
                  Entfernen
                </button>
              )}
            </div>
            {coverError && (
              <p className="text-red-300 text-xs">{coverError}</p>
            )}
            <input
              type="url"
              value={coverUrl ?? ""}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="oder URL einfuegen: https://..."
              className={inputCls}
            />
            <p className="text-cream/40 text-[10px] uppercase tracking-[0.22em]">
              JPEG / PNG / WebP · max 8 MB · empfohlen 1600 × 700
            </p>
          </div>
        </Field>

        <Field label="Gewinn / Prize (optional)" full>
          <textarea
            rows={2} value={prize ?? ""}
            onChange={(e) => setPrize(e.target.value)}
            className={inputCls + " resize-none"}
          />
        </Field>

        {source === "tiktok" && (
          <Field label="Registration-URL (TikTok-Event)" required full>
            <input
              type="url" required value={registrationUrl ?? ""}
              onChange={(e) => setRegistrationUrl(e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
            <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em] mt-2">
              TikTok-Events brauchen einen externen Anmelde-Link. Pflicht.
            </p>
          </Field>
        )}

        <Field label="Sichtbarkeit" full>
          <div className="flex flex-wrap gap-2 mb-3">
            {(["all", "selected"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setVisibilityMode(m)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] border transition-colors ${
                  visibilityMode === m
                    ? "bg-champagne text-ink border-champagne"
                    : "border-champagne/30 text-cream/55 hover:border-champagne/60 hover:text-cream"
                }`}
              >
                {m === "all" ? "Alle Creator" : "Ausgewaehlte Creator"}
              </button>
            ))}
          </div>
          {visibilityMode === "selected" && (
            <div className="border border-champagne/15 p-3 space-y-2">
              <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em]">
                {allowedIds.length} ausgewaehlt
              </p>
              <input
                type="search"
                value={creatorQuery}
                onChange={(e) => setCreatorQuery(e.target.value)}
                placeholder="Creator suchen…"
                className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-2 text-cream text-sm focus:outline-none placeholder-cream/30"
              />
              <ul className="max-h-60 overflow-y-auto space-y-1">
                {filteredCreators.map((c) => {
                  const on = allowedIds.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => toggleAllowed(c.id)}
                        className={`w-full text-left px-3 py-2 border transition-colors flex items-center justify-between gap-3 ${
                          on
                            ? "border-champagne bg-champagne/10"
                            : "border-transparent hover:border-champagne/30 hover:bg-champagne/5"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${on ? "text-cream" : "text-cream/85"}`}>{c.label}</p>
                          {c.hint && (
                            <p className="text-cream/40 text-[10px] uppercase tracking-[0.22em]">
                              {c.hint}
                            </p>
                          )}
                        </div>
                        <span className={`text-[10px] uppercase tracking-[0.25em] shrink-0 ${on ? "text-champagne" : "text-cream/35"}`}>
                          {on ? "Drin" : "+"}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {filteredCreators.length === 0 && (
                  <li className="text-cream/35 text-sm px-3 py-2">Keine Treffer.</li>
                )}
              </ul>
            </div>
          )}
        </Field>

        <Field label="Regeln (lang, optional)" full>
          <textarea
            rows={5} value={rules ?? ""}
            onChange={(e) => setRules(e.target.value)}
            className={inputCls + " resize-none"}
          />
        </Field>
      </div>

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">{error}</div>}
      {success && <div className="border border-green-500/40 bg-green-500/10 px-4 py-2 text-green-300 text-sm">{success}</div>}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? (isEdit ? "Speichere…" : "Lege an…") : (isEdit ? "Aenderungen speichern" : "Event anlegen")}
      </button>
    </form>
  );
}

const inputCls = "w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base";
const selectCls = "w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none text-base";

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">
        {label}{required && <span className="text-red-300 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
