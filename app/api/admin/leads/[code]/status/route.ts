/*
 * PATCH /api/admin/leads/[code]/status — update Lead.status.
 *
 * Body: { status: LeadStatus }. Any-to-any transition allowed per PM
 * sign-off Q3; AuditLog catches every change so reverts are
 * traceable. No-op (same status) returns 200 with changed=false
 * and skips the audit insert (withAudit handles that).
 *
 * Role gate: EDITOR_ROLES (support is read-only). 401 cookie missing,
 * 403 wrong role, 404 lead code unresolved, 400 body shape, 200 ok.
 */

import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { dispatchLeadEvent } from "@/lib/admin/lead-events";
import { updateLeadStatus } from "@/lib/admin/lead-mutations";
import { EDITOR_ROLES, extractClientMeta, mapMutationError } from "@/lib/admin/mutation-helpers";
import { LEAD_STATUSES } from "@/lib/admin/leads/filters";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(LEAD_STATUSES as readonly [string, ...string[]]),
});

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const gate = await requireRole(EDITOR_ROLES);
  if (!gate.ok) {
    return NextResponse.json({ ok: false }, { status: gate.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "bad_body" }, { status: 400 });
  }

  const meta = extractClientMeta(req);
  try {
    const newStatus = parsed.data.status as (typeof LEAD_STATUSES)[number];
    const result = await updateLeadStatus(
      { actorId: gate.session.userId, ip: meta.ip, ua: meta.ua },
      params.code,
      newStatus,
    );
    // Fire the customer-facing notification (inbox row + email)
    // only if the mutation actually changed state. waitUntil keeps
    // the response under ~100ms while the dispatcher completes in
    // background — same pattern as the M3 PM-alert closure.
    if (result.changed) {
      waitUntil(
        dispatchLeadEvent(params.code, {
          name: "consult.status_changed",
          input: { leadCode: params.code, newStatus },
        })
          .then((res) => {
            if (!res.ok) {
              console.warn(
                `[lead-events] status_changed code=${params.code} skipped: ${res.reason}`,
              );
            }
          })
          .catch((err) =>
            console.error(
              `[lead-events] status_changed code=${params.code} failed:`,
              err instanceof Error ? err.message : err,
            ),
          ),
      );
    }
    return NextResponse.json({ ok: true, changed: result.changed }, { status: 200 });
  } catch (err) {
    const mapped = mapMutationError(err);
    if (mapped) return mapped;
    console.error("[admin/leads/status] mutation failed:", err);
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }
}
