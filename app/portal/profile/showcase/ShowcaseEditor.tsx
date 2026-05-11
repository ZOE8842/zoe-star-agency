"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertShowcase, deleteOwnShowcase, resendConsentMail } from "./actions";
import { CreatorShowcaseCard } from "@/components/CreatorShowcaseCard";

interface ImageEntry {
  url: string;
  type: "image";
  position: number;
}

interface ShowcaseRow {
  id: string;
  display_name: string;
  category: string | null;
  showcase_image: string | null;
  showcase_images: ImageEntry[] | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  is_approved: boolean;
  is_featured: boolean;
  birthday_day: number | null;
  birthday_month: number | null;
}

interface Props {
  initial: ShowcaseRow | null;
  email: string;
  showcaseRequested: boolean;
  showcaseConfirmed: boolean;
  cooperationRequested: boolean;
  cooperationConfirmed: boolean;
}

const MONTHS = [
  { v: 1, l: "Januar" }, { v: 2, l: "Februar" }, { v: 3, l: "Maerz" },
  { v: 4, l: "April" }, { v: 5, l: "Mai" }, { v: 6, l: "Juni" },
  { v: 7, l: "Juli" }, { v: 8, l: "August" }, { v: 9, l: "September" },
  { v: 10, l: "Oktober" }, { v: 11, l: "November" }, { v: 12, l: "Dezember" },
];

function imagesFromInitial(initial: ShowcaseRow | null): { url1: string; url2: string } {
  if (!initial) return { url1: "", url2: "" };
  const arr = Array.isArray(initial.showcase_images) ? initial.showcase_images : [];
  const i1 = arr.find((i) => i.position === 1)?.url ?? initial.showcase_image ?? "";
  const i2 = arr.find((i) => i.position === 2)?.url ?? "";
  return { url1: i1, url2: i2 };
}

export function ShowcaseEditor({
  initial, email, showcaseRequested, showcaseConfirmed,
  cooperationRequested, cooperationConfirmed,
}: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [tiktok, setTiktok] = useState(initial?.tiktok_url ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram_url ?? "");
  const initImgs = imagesFromInitial(initial);
  const [imageUrl1, setImageUrl1] = useState(initImgs.url1);
  const [imageUrl2, setImageUrl2] = useState(initImgs.url2);
  const [bday, setBday] = useState<string>(initial?.birthday_day ? String(initial.birthday_day) : "");
  const [bmonth, setBmonth] = useState<string>(initial?.birthday_month ? String(initial.birthday_month) : "");
  const [allowShowcase, setAllowShowcase] = useState(showcaseRequested);
  const [allowCooperations, setAllowCooperations] = useState(cooperationRequested);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, position: 1 | 2) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setInfo(null);
    setUploading(position);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("position", String(position));
    const res = await fetch("/api/showcase/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(null);
    if (!res.ok) { setError(json.error || "Upload fehlgeschlagen."); return; }
    if (position === 1) setImageUrl1(json.showcase_image);
    else setImageUrl2(json.showcase_image);
    setInfo("Bild hochgeladen. Speichern nicht vergessen.");
  }

  async function handleImageRemove(position: 1 | 2) {
    setError(null); setInfo(null);
    const res = await fetch(`/api/showcase/upload?position=${position}`, { method: "DELETE" });
    if (res.ok) {
      if (position === 1) setImageUrl1("");
      else setImageUrl2("");
      setInfo("Bild entfernt.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setInfo(null); setSaving(true);
    const images: ImageEntry[] = [];
    if (imageUrl1) images.push({ url: imageUrl1, type: "image", position: 1 });
    if (imageUrl2) images.push({ url: imageUrl2, type: "image", position: 2 });

    const result = await upsertShowcase({
      display_name: displayName,
      category,
      showcase_images: images,
      tiktok_url: tiktok,
      instagram_url: instagram,
      birthday_day: bday ? parseInt(bday) : null,
      birthday_month: bmonth ? parseInt(bmonth) : null,
      request_showcase: allowShowcase,
      request_cooperations: allowCooperations,
    });
    setSaving(false);
    if (!result.ok) { setError(result.error || "Speichern fehlgeschlagen."); return; }
    const sent = result.mail_sent ?? [];
    if (sent.length > 0) {
      setInfo(`Gespeichert. Bestaetigungs-Mail an ${email} geschickt (${sent.join(" + ")}).`);
    } else {
      setInfo("Gespeichert.");
    }
    router.refresh();
  }

  async function handleResend(type: "showcase" | "brand_cooperation") {
    setError(null); setInfo(null);
    const r = await resendConsentMail(type);
    if (!r.ok) {
      setError(r.error || "Mail-Versand fehlgeschlagen.");
      return;
    }
    setInfo(`Bestaetigungs-Mail erneut an ${email} verschickt.`);
  }

  async function handleDelete() {
    if (!confirm("Showcase wirklich loeschen?")) return;
    setError(null); setInfo(null);
    const result = await deleteOwnShowcase();
    if (!result.ok) { setError(result.error || "Loeschen fehlgeschlagen."); return; }
    setDisplayName(""); setCategory(""); setTiktok(""); setInstagram("");
    setImageUrl1(""); setImageUrl2(""); setBday(""); setBmonth("");
    setInfo("Showcase geloescht.");
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
      <form onSubmit={handleSave} className="space-y-7">
        <FieldGroup label="Display Name">
          <input
            type="text" required maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="z.B. ZOE Star Agency"
          />
        </FieldGroup>

        <FieldGroup label="Kategorie">
          <input
            type="text" maxLength={60}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="z.B. Beauty · Creator / LIVE · Match Night"
          />
        </FieldGroup>

        <div>
          <p className="eyebrow mb-3">Showcase-Bilder · 1 oder 2</p>
          <div className="grid grid-cols-2 gap-4">
            <ImageSlot
              position={1}
              url={imageUrl1}
              uploading={uploading === 1}
              onUpload={(e) => handleImageUpload(e, 1)}
              onRemove={() => handleImageRemove(1)}
            />
            <ImageSlot
              position={2}
              url={imageUrl2}
              uploading={uploading === 2}
              onUpload={(e) => handleImageUpload(e, 2)}
              onRemove={() => handleImageRemove(2)}
            />
          </div>
          <p className="text-cream/40 text-xs mt-2">JPEG, PNG oder WebP · max 20 MB · High-Quality Showcase empfohlen · Hochformat 3:4 ideal.</p>
        </div>

        <div>
          <p className="eyebrow mb-3">Geburtstag <span className="text-cream/35 normal-case tracking-normal">— Damit wir dich nicht vergessen 🎉</span></p>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={bday}
              onChange={(e) => setBday(e.target.value)}
              className="bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
            >
              <option value="" className="bg-ink">— Tag —</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d} className="bg-ink">{d}</option>
              ))}
            </select>
            <select
              value={bmonth}
              onChange={(e) => setBmonth(e.target.value)}
              className="bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
            >
              <option value="" className="bg-ink">— Monat —</option>
              {MONTHS.map((m) => (
                <option key={m.v} value={m.v} className="bg-ink">{m.l}</option>
              ))}
            </select>
          </div>
          <p className="text-cream/40 text-xs mt-2">
            Tag + Monat reichen. Kein Jahr. Bleibt intern.
          </p>
        </div>

        <FieldGroup label="TikTok-URL">
          <input
            type="url" value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="https://www.tiktok.com/@deinhandle"
          />
        </FieldGroup>

        <FieldGroup label="Instagram-URL">
          <input
            type="url" value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="https://www.instagram.com/deinhandle"
          />
        </FieldGroup>

        <div className="space-y-1 pt-3 border-t border-champagne/10">
          <p className="eyebrow mb-3">Freigaben</p>

          <ConsentToggle
            checked={allowShowcase}
            onChange={setAllowShowcase}
            label="Showcase auf der Webseite"
            description="Dein TikTok-Profil + Display-Name + Kategorie + Bilder duerfen auf zoe-star.de erscheinen. Erst nach Email-Bestaetigung + Admin-Freigabe sichtbar."
            statusBadge={
              showcaseConfirmed ? "confirmed"
              : showcaseRequested ? "pending"
              : null
            }
            resendType={showcaseRequested && !showcaseConfirmed ? "showcase" : null}
            onResend={() => handleResend("showcase")}
          />

          <ConsentToggle
            checked={allowCooperations}
            onChange={setAllowCooperations}
            label="Brand-Kooperationen"
            description="Wir kommen auf dich zu wenn ein Partner zu deinem Profil passt. Keine automatische Teilnahme — du entscheidest immer selbst."
            statusBadge={
              cooperationConfirmed ? "confirmed"
              : cooperationRequested ? "pending"
              : null
            }
            resendType={cooperationRequested && !cooperationConfirmed ? "brand_cooperation" : null}
            onResend={() => handleResend("brand_cooperation")}
          />
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>
        )}
        {info && (
          <div className="border border-champagne/30 bg-champagne/5 px-4 py-3 text-champagne text-sm">{info}</div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-cta btn-shimmer disabled:opacity-50">
            {saving ? "Speichere…" : "Speichern"}
            <span className="btn-cta-arrow" aria-hidden>→</span>
          </button>
          {initial && (
            <button
              type="button" onClick={handleDelete}
              className="text-red-300/70 hover:text-red-300 text-[10px] uppercase tracking-[0.25em] px-3 py-2"
            >
              Loeschen
            </button>
          )}
        </div>

        <p className="text-cream/40 text-xs leading-relaxed pt-2 border-t border-champagne/10">
          Hinweis: Nach jedem Edit ist die Showcase-Card wieder im Pending-Status.
          Bei aktivierten Freigaben erhaeltst du eine Bestaetigungs-Mail an {email}.
        </p>
      </form>

      <div>
        <p className="eyebrow mb-4">Live-Preview</p>
        <div className="max-w-[320px]">
          <CreatorShowcaseCard
            displayName={displayName || "Display Name"}
            category={category || undefined}
            imageSrc={imageUrl1 || undefined}
            platform={tiktok ? "tiktok" : instagram ? "instagram" : null}
            visual="champagne"
          />
        </div>
        <p className="text-cream/40 text-xs mt-4 max-w-[320px]">
          So sieht deine Card auf der Public-Site aus. Plattform-Link wird
          automatisch gewaehlt (TikTok bevorzugt, sonst Instagram).
        </p>
        {imageUrl2 && (
          <div className="mt-6 max-w-[320px]">
            <p className="eyebrow mb-2">Zweites Bild</p>
            <img src={imageUrl2} alt="" loading="lazy" className="w-full aspect-[3/4] object-cover border border-champagne/20" />
          </div>
        )}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      {children}
    </div>
  );
}

function ImageSlot({
  position, url, uploading, onUpload, onRemove,
}: {
  position: 1 | 2;
  url: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-champagne/15 p-3">
      <p className="eyebrow mb-2">Bild {position}</p>
      {url ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" loading="lazy" className="w-full aspect-[3/4] object-cover border border-champagne/20" />
          <button
            type="button" onClick={onRemove}
            className="text-cream/45 hover:text-red-300/80 text-[10px] uppercase tracking-[0.25em]"
          >
            entfernen
          </button>
        </div>
      ) : (
        <label className="block aspect-[3/4] border border-dashed border-champagne/30 hover:border-champagne hover:bg-champagne/5 transition-colors flex items-center justify-center cursor-pointer text-cream/45 text-xs text-center px-2">
          <input
            type="file" accept="image/jpeg,image/png,image/webp"
            onChange={onUpload}
            className="hidden"
          />
          {uploading ? "Lade hoch…" : `Bild ${position} hochladen`}
        </label>
      )}
    </div>
  );
}

function ConsentToggle({
  checked, onChange, label, description, statusBadge, resendType, onResend,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  statusBadge: "confirmed" | "pending" | null;
  resendType: "showcase" | "brand_cooperation" | null;
  onResend: () => void;
}) {
  return (
    <div className="p-3 -m-3 hover:bg-champagne/5 transition-colors">
      <button
        type="button" onClick={() => onChange(!checked)}
        className="w-full text-left flex items-start gap-3"
      >
        <span
          className={`shrink-0 mt-0.5 w-4 h-4 border flex items-center justify-center text-[10px] transition-all ${
            checked
              ? "border-champagne bg-champagne text-ink"
              : "border-champagne/30"
          }`}
        >
          {checked ? "✓" : ""}
        </span>
        <span className="flex-1">
          <span className="flex items-baseline gap-2 flex-wrap">
            <span className="text-cream text-sm">{label}</span>
            {statusBadge === "confirmed" && (
              <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] bg-champagne text-ink">
                Email bestaetigt
              </span>
            )}
            {statusBadge === "pending" && (
              <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.25em] border border-champagne/40 text-champagne">
                Email-Bestaetigung offen
              </span>
            )}
          </span>
          <span className="block text-cream/45 text-xs mt-1 leading-relaxed">
            {description}
          </span>
        </span>
      </button>
      {resendType && (
        <div className="pl-7 mt-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onResend(); }}
            className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] underline-offset-2 hover:underline"
          >
            Mail erneut senden →
          </button>
        </div>
      )}
    </div>
  );
}
