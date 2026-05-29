/*
 * POST /api/admin/leads/[code]/notes — add a Note row.
 *
 * Body: { body: string }. 1–2000 chars. Creates a Note row + an
 * AuditLog "lead.note.add" entry inside the same transaction
 * (withAudit). Returns 201 with the new note id.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/require-role";
import { addLeadNote } from "@/lib/admin/lead-mutations";
import { EDITOR_ROLES, extractClientMeta, mapMutationError } from "@/lib/admin/mutation-helpers";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function POST(req: Request, { params }: { params: { code: string } }) {
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
    const result = await addLeadNote(
      { actorId: gate.session.userId, ip: meta.ip, ua: meta.ua },
      params.code,
      parsed.data.body,
    );
    return NextResponse.json({ ok: true, noteId: result.noteId }, { status: 201 });
  } catch (err) {
    const mapped = mapMutationError(err);
    if (mapped) return mapped;
    console.error("[admin/leads/notes] mutation failed:", err);
    return NextResponse.json({ ok: false, error: "unknown" }, { status: 500 });
  }
}
