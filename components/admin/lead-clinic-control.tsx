"use client";

/*
 * components/admin/lead-clinic-control.tsx — clinic picker for the
 * drawer. Symmetric with lead-owner-control. Clinic options come
 * from a server-side query of verified clinics.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface ClinicOption {
  id: string;
  label: string;
}

interface Props {
  code: string;
  currentClinicId: string | null;
  clinicOptions: readonly ClinicOption[];
  labels: { none: string; placeholder: string };
}

const NULL_VALUE = "__null__";

export function LeadClinicControl({ code, currentClinicId, clinicOptions, labels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<string | null>(currentClinicId);

  async function change(rawValue: string) {
    const next = rawValue === NULL_VALUE ? null : rawValue;
    if (next === optimistic) return;
    const prev = optimistic;
    setOptimistic(next);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${code}/clinic`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId: next }),
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
        <option value={NULL_VALUE}>{labels.none}</option>
        {clinicOptions.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-deep">!{error}</p>}
    </div>
  );
}
