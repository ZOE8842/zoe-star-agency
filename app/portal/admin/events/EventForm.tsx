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

export function EventForm({ initial }: { initial?: EventInitial }) {
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
  const [status, setStatus] = useState<string>(initial?.status ?? "open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

        <Field label="Cover-URL (optional)" full>
          <input
            type="url" value={coverUrl ?? ""}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
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
