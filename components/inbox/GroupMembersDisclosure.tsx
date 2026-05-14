"use client";

import { useState } from "react";

export interface GroupMemberInfo {
  id: string;
  display_name: string | null;
  tiktok_username: string | null;
  role: string;
  member_role: string;
  is_me: boolean;
}

interface Props {
  members: GroupMemberInfo[];
}

// Disclosure-Komponente fuer Group-Mitglieder. Default eingeklappt,
// auf Click expandiert. Mobile-freundlich, kein Layout-Shift.
export function GroupMembersDisclosure({ members }: Props) {
  const [open, setOpen] = useState(false);
  const total = members.length;

  return (
    <section className="mb-8 border border-champagne/15">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus:bg-champagne/5 hover:bg-champagne/5 transition-colors"
      >
        <span className="text-cream/65 text-[10px] uppercase tracking-[0.25em]">
          Mitglieder · {total}
        </span>
        <span className="text-cream/40 text-[10px]" aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <ul className="border-t border-champagne/10 divide-y divide-cream/[0.05] max-h-72 overflow-y-auto">
          {members.map((m) => {
            const handle = m.tiktok_username ? `@${m.tiktok_username}` : null;
            const roleLabel =
              m.role === "admin" ? "Admin"
              : m.role === "manager" ? "Manager"
              : m.role === "creator" ? "Creator"
              : m.role;
            const memberRoleLabel = m.member_role === "owner" ? "Owner" : null;
            return (
              <li key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${m.is_me ? "text-champagne font-medium" : "text-cream/85"}`}>
                    {m.display_name ?? "—"}
                    {m.is_me && <span className="text-cream/40 text-[10px] ml-2">(Du)</span>}
                  </p>
                  {handle && (
                    <p className="text-cream/40 text-[10px] uppercase tracking-[0.22em]">
                      {handle}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px] uppercase tracking-[0.25em]">
                  <span className="text-cream/50">{roleLabel}</span>
                  {memberRoleLabel && (
                    <span className="text-champagne">{memberRoleLabel}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
