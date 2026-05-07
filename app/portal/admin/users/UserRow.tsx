"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
  tiktok_username: string;
  display_name: string;
  role: string;
  status: string;
  country: string | null;
  joined_at: string;
}

export function UserRow({ user }: { user: User }) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [saving, setSaving] = useState(false);

  async function update(field: "role" | "status", value: string) {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("profiles").update({ [field]: value }).eq("id", user.id);
    if (field === "role") setRole(value);
    if (field === "status") setStatus(value);
    setSaving(false);
    router.refresh();
  }

  return (
    <tr className="border-t border-champagne/10 hover:bg-champagne/5">
      <td className="px-4 py-3 text-sm text-cream font-medium">
        <Link href={`/portal/admin/users/${user.id}`} className="hover:text-champagne transition-colors">
          {user.display_name}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-cream/70">@{user.tiktok_username}</td>
      <td className="px-4 py-3 text-sm text-cream/60">{user.email}</td>
      <td className="px-4 py-3">
        <select
          value={role} onChange={(e) => update("role", e.target.value)}
          disabled={saving}
          className="bg-ink border border-champagne/30 px-2 py-1 text-cream text-xs uppercase tracking-[0.15em] focus:border-champagne focus:outline-none"
        >
          <option value="creator">Creator</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={status} onChange={(e) => update("status", e.target.value)}
          disabled={saving}
          className="bg-ink border border-champagne/30 px-2 py-1 text-cream text-xs uppercase tracking-[0.15em] focus:border-champagne focus:outline-none"
        >
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </td>
      <td className="px-4 py-3 text-cream/40 text-[10px] uppercase tracking-[0.2em]">
        {new Date(user.joined_at).toLocaleDateString("de-DE")}
      </td>
    </tr>
  );
}
