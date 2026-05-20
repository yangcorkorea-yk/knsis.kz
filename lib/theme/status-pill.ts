import type { LeadStatus } from "@prisma/client";

/*
 * Lead status pill palette — admin lead table and drawer.
 * Source: _archive/v1-handoff/handoff-package/docs/08-design-tokens.md §"Lead status pill".
 *
 * Background + foreground pairs are pre-paired for AA contrast.
 * Use via:
 *   <span style={statusPillStyle(lead.status)}>…</span>
 * or copy the values into a Tailwind arbitrary class when the
 * status is static at render time.
 */

export const STATUS_PILL: Record<LeadStatus, { bg: string; fg: string; label: string }> = {
  new: { bg: "#FCE7EC", fg: "#C84365", label: "New" },
  contacted: { bg: "#E5F4EC", fg: "#1F7A4D", label: "Contacted" },
  in_progress: { bg: "#FFF5E1", fg: "#A07012", label: "In progress" },
  scheduled: { bg: "#EAE4F5", fg: "#5E4B82", label: "Scheduled" },
  done: { bg: "#F0EDE8", fg: "#5A5A5A", label: "Done" },
  on_hold: { bg: "#FDE8E4", fg: "#A04432", label: "On hold" },
};

export function statusPillStyle(status: LeadStatus) {
  const t = STATUS_PILL[status];
  return { backgroundColor: t.bg, color: t.fg } as const;
}
