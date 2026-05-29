"use client";

/*
 * components/admin/lead-status-control.tsx — interactive status
 * picker for the drawer. Renders the same colored pill row as the
 * filter bar; click → PATCH /api/admin/leads/{code}/status →
 * `router.refresh()` so the drawer's read panel + activity log
 * reflect the new state.
 *
 * No-op clicks (target equals current) still round-trip, but the
 * mutation surface (withAudit) skips the audit insert + the UI
 * just re-renders the same pill — the user sees no flash.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { LeadStatus } from "@prisma/client";
import { LEAD_STATUSES } from "@/lib/admin/leads/filters";
import { statusPillStyle } from "@/lib/theme/status-pill";

interface Props {
  code: string;
  current: LeadStatus;
  labels: Record<LeadStatus, string>;
}

export function LeadStatusControl({ code, current, labels }: Props) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState<LeadStatus>(current);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function pick(next: LeadStatus) {
    if (next === optimistic) return;
    const prev = optimistic;
    setOptimistic(next);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${code}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
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
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="status"
        aria-busy={pending}
      >
        {LEAD_STATUSES.map((s) => {
          const active = s === optimistic;
          const baseStyle = active ? statusPillStyle(s) : undefined;
          return (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              disabled={pending}
              aria-pressed={active}
              style={baseStyle}
              className={
                active
                  ? "rounded-full px-3 py-1 text-xs font-medium ring-2 ring-rose-deep/30 ring-offset-1"
                  : "rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-body hover:bg-ground disabled:opacity-50"
              }
            >
              {labels[s]}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-rose-deep">!{error}</p>}
    </div>
  );
}
