"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, updateUserStatus } from "./actions";

const ROLES = ["creator", "manager", "admin"] as const;
const STATUSES = ["active", "paused", "suspended"] as const;

export function UserActions({
  userId,
  currentRole,
  currentStatus,
}: {
  userId: string;
  currentRole: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [status, setStatus] = useState(currentStatus);
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

  return (
    <div className="space-y-8">
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

      {error && (
        <div className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
