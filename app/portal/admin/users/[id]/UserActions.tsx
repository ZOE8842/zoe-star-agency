"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, updateUserStatus, updateUserManager } from "./actions";

const ROLES = ["creator", "manager", "admin"] as const;
const STATUSES = ["active", "paused", "suspended"] as const;

interface ManagerOption {
  id: string;
  display_name: string;
  role: string;
}

export function UserActions({
  userId,
  currentRole,
  currentStatus,
  currentManagerId,
  availableManagers,
}: {
  userId: string;
  currentRole: string;
  currentStatus: string;
  currentManagerId: string | null;
  availableManagers: ManagerOption[];
}) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [status, setStatus] = useState(currentStatus);
  const [managerId, setManagerId] = useState<string | null>(currentManagerId);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(next: string) {
    setLoading("role");
    setError(null);
    const result = await updateUserRole(userId, next);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setRole(next);
      router.refresh();
    }
    setLoading(null);
  }

  async function changeStatus(next: string) {
    setLoading("status");
    setError(null);
    const result = await updateUserStatus(userId, next);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setStatus(next);
      router.refresh();
    }
    setLoading(null);
  }

  async function changeManager(next: string | null) {
    setLoading("manager");
    setError(null);
    const result = await updateUserManager(userId, next);
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setManagerId(next);
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cream/40 mb-3">Rolle</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => changeRole(r)}
              disabled={loading === "role" || r === role}
              className={`text-[10px] uppercase tracking-[0.25em] inline-flex items-center min-h-[40px] px-4 transition-colors ${
                r === role
                  ? "bg-champagne text-ink"
                  : "border border-cream/[0.1] hover:border-champagne text-cream/70 hover:text-champagne"
              } disabled:opacity-50`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cream/40 mb-3">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={loading === "status" || s === status}
              className={`text-[10px] uppercase tracking-[0.25em] inline-flex items-center min-h-[40px] px-4 transition-colors ${
                s === status
                  ? "bg-champagne text-ink"
                  : "border border-cream/[0.1] hover:border-champagne text-cream/70 hover:text-champagne"
              } disabled:opacity-50`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-cream/40 mb-3">Betreut von</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => changeManager(null)}
            disabled={loading === "manager" || managerId === null}
            className={`text-[10px] uppercase tracking-[0.25em] inline-flex items-center min-h-[40px] px-4 transition-colors ${
              managerId === null
                ? "bg-champagne text-ink"
                : "border border-cream/[0.1] hover:border-champagne text-cream/70 hover:text-champagne"
            } disabled:opacity-50`}
          >
            Niemand
          </button>
          {availableManagers.map((m) => (
            <button
              key={m.id}
              onClick={() => changeManager(m.id)}
              disabled={loading === "manager" || managerId === m.id}
              title={m.role}
              className={`text-[10px] uppercase tracking-[0.25em] inline-flex items-center min-h-[40px] px-4 transition-colors ${
                managerId === m.id
                  ? "bg-champagne text-ink"
                  : "border border-cream/[0.1] hover:border-champagne text-cream/70 hover:text-champagne"
              } disabled:opacity-50`}
            >
              {m.display_name}
            </button>
          ))}
        </div>
        {availableManagers.length === 0 && (
          <p className="text-cream/35 text-xs mt-3">
            Keine aktiven Manager im Roster. Erst eine Person auf Rolle „manager" oder „admin" setzen.
          </p>
        )}
      </div>

      {error && (
        <div className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
