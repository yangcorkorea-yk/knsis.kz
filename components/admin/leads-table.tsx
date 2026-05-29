/*
 * components/admin/leads-table.tsx — server-rendered leads table.
 *
 * Server component. Rows link to the drawer route
 * `/admin/{locale}/leads/{code}` — the drawer is route-based per spec
 * so deep-links work and back/forward navigates the drawer state.
 *
 * Phone is NOT exposed here per PM sign-off Q5 — only inside the
 * drawer (PII minimisation, CLAUDE.md §2 rule 3). Columns:
 * code · status · name · city · kind · createdAt.
 */

import Link from "next/link";
import type { LeadKind, LeadStatus } from "@prisma/client";
import type { AdminLeadRow } from "@/lib/admin/leads/queries";
import { LeadStatusPill } from "./lead-status-pill";

interface Labels {
  table: {
    code: string;
    status: string;
    name: string;
    city: string;
    kind: string;
    createdAt: string;
  };
  status: Record<LeadStatus, string>;
  kind: Record<LeadKind, string>;
  region: Record<string, string>;
  empty: string;
  emptyFiltered: string;
}

interface Props {
  locale: string;
  rows: readonly AdminLeadRow[];
  labels: Labels;
  /** True when the empty result is the consequence of an active filter. */
  emptyIsFiltered: boolean;
  /** Locale-aware date formatter so KZ / RU / KR render natively. */
  dateFormat: (d: Date) => string;
}

export function LeadsTable({ locale, rows, labels, emptyIsFiltered, dateFormat }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center bg-paper px-6 py-16 text-sm text-ink-mute">
        {emptyIsFiltered ? labels.emptyFiltered : labels.empty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-paper">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-ground">
          <tr>
            <Th>{labels.table.code}</Th>
            <Th>{labels.table.status}</Th>
            <Th>{labels.table.name}</Th>
            <Th>{labels.table.city}</Th>
            <Th>{labels.table.kind}</Th>
            <Th>{labels.table.createdAt}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const cities = row.regions.map((slug) => labels.region[slug] ?? slug).join(", ");
            const kinds = row.kind
              .map((k) => labels.kind[k])
              .filter(Boolean)
              .join(" · ");
            return (
              <tr key={row.id} className="hover:bg-ground/60">
                <Td>
                  <Link
                    href={`/admin/${locale}/leads/${row.code}`}
                    className="font-medium text-rose-deep hover:underline"
                  >
                    {row.code}
                  </Link>
                </Td>
                <Td>
                  <LeadStatusPill status={row.status} label={labels.status[row.status]} />
                </Td>
                <Td className="text-ink">{row.user.name ?? "—"}</Td>
                <Td className="text-ink-body">{cities || "—"}</Td>
                <Td className="text-ink-body">{kinds || "—"}</Td>
                <Td className="text-ink-mute">{dateFormat(row.createdAt)}</Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-mute"
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 align-middle ${className ?? ""}`}>{children}</td>;
}
