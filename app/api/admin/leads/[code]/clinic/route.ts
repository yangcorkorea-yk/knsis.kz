/*
 * PATCH /api/admin/leads/[code]/clinic — assign / unassign clinic.
 *
 * Body: { clinicId: string | null }. Symmetric with owner route.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { assignLeadClinic } from "@/lib/admin/lead-mutations";
import { EDITOR_ROLES, extractClientMeta, mapMutationError } from "@/lib/admin/mutation-helpers";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const bodySchema = z.object({
  clinicId: z
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
    const result = await assignLeadClinic(
      { actorId: gate.session.userId, ip: meta.ip, ua: meta.ua },
      params.code,
      parsed.data.clinicId ? parsed.data.clinicId.toLowerCase() : null,
    );
    return NextResponse.json({ ok: true, changed: result.changed }, { status: 200 });
  } catch (err) {
    const mapped = mapMutationError(err);
    if (mapped) return mapped;
    console.error("[admin/leads/clinic] mutation failed:", err);
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }
}
