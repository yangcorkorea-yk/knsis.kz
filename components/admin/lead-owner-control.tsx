"use client";

/*
 * components/admin/lead-owner-control.tsx — owner picker for the
 * drawer. Native <select> dropdown with the "—" (no change /
 * cancel), unassigned sentinel, and the staff option list. Change
 * → PATCH /api/admin/leads/{code}/owner → router.refresh().
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface StaffOption {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  code: string;
  currentOwnerId: string | null;
  staffOptions: readonly StaffOption[];
  labels: { unassigned: string; placeholder: string };
}

const NULL_VALUE = "__null__";

export function LeadOwnerControl({ code, currentOwnerId, staffOptions, labels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<string | null>(currentOwnerId);

  async function change(rawValue: string) {
    const next = rawValue === NULL_VALUE ? null : rawValue;
    if (next === optimistic) return;
    const prev = optimistic;
    setOptimistic(next);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${code}/owner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: next }),
      });
      if (!res.ok) {
        setOptimistic(prev);
        setError(String(res.status));
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setOptimistic(prev);
      setError("network");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={optimistic ?? NULL_VALUE}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        aria-label={labels.placeholder}
        className="h-8 rounded-md border border-line bg-paper px-2 text-xs text-ink disabled:opacity-50"
      >
        <option value={NULL_VALUE}>{labels.unassigned}</option>
        {staffOptions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name ?? s.email}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-deep">!{error}</p>}
    </div>
  );
}
