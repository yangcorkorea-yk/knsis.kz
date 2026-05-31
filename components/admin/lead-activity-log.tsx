/*
 * components/admin/lead-activity-log.tsx — read-side activity feed
 * for the lead drawer. Server component.
 *
 * Reads from AuditLog (where entity=Lead, entityId=...). Per PM
 * sign-off Q4, the activity scope is AuditLog only — note adds
 * are captured as `action: "lead.note.add"` entries with the body
 * preview in `after`, so the feed surfaces them alongside status
 * / owner / clinic events without a separate Activity table.
 *
 * Action strings render through an i18n-labelled lookup. Unknown
 * actions fall back to the raw string so a future verb shipped
 * before its translation lands still renders (degrades to "ugly
 * but truthful" rather than silently absent).
 */

import type { LeadDrawerAuditRow } from "@/lib/admin/leads/drawer-queries";

export interface LeadActivityLogLabels {
  title: string;
  empty: string;
  actions: Record<string, string>;
}

interface Props {
  rows: readonly LeadDrawerAuditRow[];
  labels: LeadActivityLogLabels;
  dateFormat: (d: Date) => string;
}

function summariseChange(action: string, before: unknown, after: unknown): string | null {
  // Render a compact "before → after" preview where the shape allows.
  if (action === "lead.note.add" && after && typeof after === "object" && "bodyPreview" in after) {
    return String((after as { bodyPreview?: unknown }).bodyPreview ?? "");
  }
  const beforeStr = stringifyField(before);
  const afterStr = stringifyField(after);
  if (beforeStr === null && afterStr === null) return null;
  if (beforeStr === null) return `→ ${afterStr ?? "—"}`;
  if (afterStr === null) return `${beforeStr} →`;
  return `${beforeStr} → ${afterStr}`;
}

function stringifyField(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "object") return String(v);
  const entries = Object.entries(v as Record<string, unknown>);
  if (entries.length === 0) return null;
  // Single-field object → just the value.
  if (entries.length === 1 && entries[0]) {
    const [, val] = entries[0];
    if (val === null) return "∅";
    if (typeof val !== "object") return String(val);
  }
  return null;
}

export function LeadActivityLog({ rows, labels, dateFormat }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
        {labels.title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-mute">{labels.empty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((row) => {
            const actionLabel = labels.actions[row.action] ?? row.action;
            const summary = summariseChange(row.action, row.before, row.after);
            const actor = row.actorName ?? row.actorEmail ?? "—";
            return (
              <li
                key={row.id}
                className="flex flex-col gap-0.5 rounded-md border border-line bg-paper p-3 text-sm"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">{actionLabel}</span>
                  <time className="text-[11px] text-ink-mute">{dateFormat(row.createdAt)}</time>
                </div>
                {summary && <p className="text-xs text-ink-body">{summary}</p>}
                <p className="text-[11px] text-ink-mute">{actor}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
