/*
 * components/admin/lead-notes-list.tsx — read-side notes display.
 * Server component. The note composer (client-side POST) ships in
 * the mutation commit.
 */

import type { LeadDrawerNote } from "@/lib/admin/leads/drawer-queries";

export interface LeadNotesListLabels {
  title: string;
  empty: string;
}

interface Props {
  notes: readonly LeadDrawerNote[];
  labels: LeadNotesListLabels;
  dateFormat: (d: Date) => string;
}

export function LeadNotesList({ notes, labels, dateFormat }: Props) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
        {labels.title}
      </h3>
      {notes.length === 0 ? (
        <p className="text-sm text-ink-mute">{labels.empty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="flex flex-col gap-1 rounded-md border border-line bg-paper p-3 text-sm"
            >
              <p className="whitespace-pre-wrap text-ink">{n.body}</p>
              <div className="flex items-center justify-between gap-2 text-[11px] text-ink-mute">
                <span>{n.authorName ?? n.authorEmail ?? "—"}</span>
                <time>{dateFormat(n.createdAt)}</time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
