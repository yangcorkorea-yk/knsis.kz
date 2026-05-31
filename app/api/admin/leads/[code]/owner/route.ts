/*
 * PATCH /api/admin/leads/[code]/owner — assign / unassign owner.
 *
 * Body: { ownerId: string | null }. null = explicit unassign.
 * UUID must be lowercase. No server-side check that the userId
 * exists as a staff member (M-POST tightens this) — the dropdown
 * source list is fetched server-side so guard is at the UI.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { assignLeadOwner } from "@/lib/admin/lead-mutations";
import { EDITOR_ROLES, extractClientMeta, mapMutationError } from "@/lib/admin/mutation-helpers";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bodySchema = z.object({
  ownerId: z
    .string()
    .nullable()
    .refine((v) => v === null || UUID_RE.test(v), { message: "must be uuid or null" }),
});

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const gate = await requireRole(EDITOR_ROLES);
  if (!gate.ok) return NextResponse.json({ ok: false }, { status: gate.status });

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
    const result = await assignLeadOwner(
      { actorId: gate.session.userId, ip: meta.ip, ua: meta.ua },
      params.code,
      parsed.data.ownerId ? parsed.data.ownerId.toLowerCase() : null,
    );
    return NextResponse.json({ ok: true, changed: result.changed }, { status: 200 });
  } catch (err) {
    const mapped = mapMutationError(err);
    if (mapped) return mapped;
    console.error("[admin/leads/owner] mutation failed:", err);
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }
}
