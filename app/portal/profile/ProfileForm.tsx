"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({ profile }: { profile: any }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [tiktok, setTiktok] = useState(profile.tiktok_username || "");
  const [country, setCountry] = useState(profile.country || "DE");
  const [language, setLanguage] = useState(profile.language || "de");
  const [bio, setBio] = useState(profile.bio || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        tiktok_username: tiktok.replace(/^@/, ""),
        country,
        language,
        bio: bio || null,
      })
      .eq("id", profile.id);

    if (err) { setError(err.message); setLoading(false); return; }
    setSuccess(true); setLoading(false); router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-6 md:p-8 space-y-5">
      <p className="eyebrow mb-2">Edit profile</p>
      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Display Name</label>
        <input
          type="text" required value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none text-base"
        />
      </div>
      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">TikTok Username</label>
        <div className="flex items-center border border-champagne/30 focus-within:border-champagne">
          <span className="px-3 text-champagne">@</span>
          <input
            type="text" required value={tiktok}
            onChange={(e) => setTiktok(e.target.value.replace(/^@/, ""))}
            className="flex-1 bg-transparent py-3 pr-4 text-cream focus:outline-none text-base"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Country</label>
          <select
            value={country} onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
          >
            <option value="DE">Germany</option>
            <option value="AT">Austria</option>
            <option value="CH">Switzerland</option>
            <option value="FR">France</option>
            <option value="TR">Türkiye</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Language</label>
          <select
            value={language} onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="fr">Français</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-cream/60 text-[10px] uppercase tracking-[0.2em] block mb-2">Bio (optional)</label>
        <textarea
          rows={3} value={bio} maxLength={300}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none resize-none text-base"
        />
      </div>

      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>}
      {success && <div className="border border-green-500/40 bg-green-500/10 px-4 py-3 text-green-300 text-sm">Saved.</div>}

      <button type="submit" disabled={loading} className="btn-primary text-[10px] py-3 px-7 disabled:opacity-50">
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
