/*
 * components/admin/lead-status-pill.tsx — colored chip for LeadStatus.
 *
 * Pure visual primitive. Pulls the bg/fg pair from
 * `lib/theme/status-pill.ts` (M0-04 design tokens). Caller passes the
 * localised label string — the pill doesn't know about i18n.
 */

import type { LeadStatus } from "@prisma/client";
import { statusPillStyle } from "@/lib/theme/status-pill";

interface Props {
  status: LeadStatus;
  label: string;
}

export function LeadStatusPill({ status, label }: Props) {
  return (
    <span
      style={statusPillStyle(status)}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-5"
    >
      {label}
    </span>
  );
}
