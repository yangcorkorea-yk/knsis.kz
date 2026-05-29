"use client";

/*
 * components/admin/leads-filter-bar.tsx — client island for the
 * admin leads filter row. URL state ⇄ controls.
 *
 * Every interaction round-trips through the URL: the bar reads
 * filters from `useSearchParams`, the server page parses them via
 * `parseAdminLeadsFilters`, fetches the matching slice, and re-
 * renders the table. The bar itself never holds a local mutable
 * filter copy — that would let the URL and the visible state drift
 * (the original v1-handoff bug surfaced in M2-02; same fix applies
 * here).
 *
 * Updates push to `/admin/{locale}/leads?...` via `router.replace`
 * so the history stack doesn't grow on every pill click; only
 * pagination uses `push`.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  LEAD_KINDS,
  LEAD_STATUSES,
  parseAdminLeadsFilters,
  serializeAdminLeadsFilters,
  UNASSIGNED_OWNER,
  type AdminLeadsFilters,
} from "@/lib/admin/leads/filters";
import type { LeadStatus } from "@prisma/client";
import { CITY_SLUGS } from "@/lib/discover/filters";

interface StaffOption {
  id: string;
  name: string | null;
  email: string;
}

export interface LeadsFilterBarLabels {
  searchPlaceholder: string;
  statusLabel: string;
  kindLabel: string;
  regionLabel: string;
  ownerLabel: string;
  hasPhoto: string;
  clear: string;
  unassigned: string;
  status: Record<LeadStatus, string>;
  kind: { korea: string; local: string };
  region: Record<"seoul" | "busan" | "almaty" | "astana", string>;
}

interface Props {
  locale: string;
  staffOptions: readonly StaffOption[];
  labels: LeadsFilterBarLabels;
}

function searchParamsToRecord(
  sp: ReturnType<typeof useSearchParams>,
): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  sp.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export function LeadsFilterBar({ locale, staffOptions, labels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = parseAdminLeadsFilters(searchParamsToRecord(searchParams));
  const [qDraft, setQDraft] = useState(current.q ?? "");

  function applyPartial(patch: Partial<AdminLeadsFilters>) {
    const next: AdminLeadsFilters = { ...current, ...patch, page: 1 };
    const sp = serializeAdminLeadsFilters(next);
    const qs = sp.toString();
    startTransition(() => {
      router.replace(`/admin/${locale}/leads${qs ? `?${qs}` : ""}`);
    });
  }

  function toggleStatus(value: LeadStatus) {
    const set = new Set(current.status);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    applyPartial({ status: Array.from(set) });
  }

  function clearAll() {
    setQDraft("");
    startTransition(() => router.replace(`/admin/${locale}/leads`));
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    applyPartial({ q: qDraft.trim() ? qDraft.trim() : null });
  }

  const hasAny =
    current.status.length > 0 ||
    current.kind !== null ||
    current.region !== null ||
    current.owner !== null ||
    current.hasPhoto ||
    current.q !== null;

  return (
    <div className="flex flex-col gap-3 border-b border-line bg-paper p-4">
      {/* Row 1 — search + status pills + clear */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2">
          <input
            type="search"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-9 min-w-[16rem] flex-1 rounded-md border border-line bg-paper px-3 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-rose-tint"
          />
        </form>
        {hasAny && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-body hover:bg-ground"
          >
            {labels.clear}
          </button>
        )}
      </div>

      {/* Row 2 — status pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-mute">{labels.statusLabel}:</span>
        {LEAD_STATUSES.map((s) => {
          const active = current.status.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-rose-tint px-3 py-1 text-xs font-medium text-rose-deep"
                  : "rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-body hover:bg-ground"
              }
            >
              {labels.status[s]}
            </button>
          );
        })}
      </div>

      {/* Row 3 — kind + region + owner + hasPhoto */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-xs text-ink-body">
          <span className="font-medium text-ink-mute">{labels.kindLabel}</span>
          <select
            value={current.kind ?? ""}
            onChange={(e) => applyPartial({ kind: (e.target.value || null) as never })}
            className="h-8 rounded-md border border-line bg-paper px-2 text-xs"
          >
            <option value="">—</option>
            {LEAD_KINDS.map((k) => (
              <option key={k} value={k}>
                {labels.kind[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-ink-body">
          <span className="font-medium text-ink-mute">{labels.regionLabel}</span>
          <select
            value={current.region ?? ""}
            onChange={(e) => applyPartial({ region: e.target.value || null })}
            className="h-8 rounded-md border border-line bg-paper px-2 text-xs"
          >
            <option value="">—</option>
            {CITY_SLUGS.map((c) => (
              <option key={c} value={c}>
                {labels.region[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-ink-body">
          <span className="font-medium text-ink-mute">{labels.ownerLabel}</span>
          <select
            value={current.owner ?? ""}
            onChange={(e) => applyPartial({ owner: e.target.value || null })}
            className="h-8 rounded-md border border-line bg-paper px-2 text-xs"
          >
            <option value="">—</option>
            <option value={UNASSIGNED_OWNER}>{labels.unassigned}</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? s.email}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-ink-body">
          <input
            type="checkbox"
            checked={current.hasPhoto}
            onChange={(e) => applyPartial({ hasPhoto: e.target.checked })}
            className="h-4 w-4 rounded border-line text-rose-deep focus:ring-rose-tint"
          />
          <span>{labels.hasPhoto}</span>
        </label>
      </div>
    </div>
  );
}
