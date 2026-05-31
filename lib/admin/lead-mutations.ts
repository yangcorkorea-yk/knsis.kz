/*
 * lib/admin/lead-mutations.ts — admin-side Lead mutations.
 *
 * All mutations transit through `withAudit` so the AuditLog row and
 * the data change land atomically (CLAUDE.md hard rule §5). Routes
 * call these functions; they do not touch `prisma.$transaction` or
 * `auditLog` directly.
 *
 * Owner / clinic assignment use `null` as the explicit unassign
 * sentinel (matching the schema's `String? @db.Uuid` shape). Status
 * transitions are unguarded per PM sign-off Q3 — any → any. The
 * audit log captures every transition so accidental reverts are
 * traceable + reversible.
 *
 * Each mutation exposes both the production form (`updateLeadStatus`)
 * and a pure DI variant (`updateLeadStatusUsing`) that takes a deps
 * bag. Tests use the DI form to avoid a live Prisma client; routes
 * use the wrapper. Same pattern as `lib/auth/require-role.ts`.
 */

import type { LeadStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { withAuditUsing, type TransactionRunner, type WithAuditResult } from "./with-audit";

export interface ActorContext {
  actorId: string;
  ip: string | null;
  ua: string | null;
}

export class LeadNotFoundError extends Error {
  constructor(public readonly code: string) {
    super(`Lead not found: ${code}`);
    this.name = "LeadNotFoundError";
  }
}

export interface LeadMutationDeps {
  /** Resolve `code` → `id`. Returns null when the lead doesn't exist. */
  findLeadIdByCode: (code: string) => Promise<{ id: string } | null>;
  /** `prisma.$transaction` (production) or a fake runner (tests). */
  runTx: TransactionRunner;
}

const productionDeps: LeadMutationDeps = {
  findLeadIdByCode: (code) => prisma.lead.findUnique({ where: { code }, select: { id: true } }),
  runTx: (fn) => prisma.$transaction(fn),
};

async function resolveLeadId(deps: LeadMutationDeps, code: string): Promise<string> {
  const row = await deps.findLeadIdByCode(code);
  if (!row) throw new LeadNotFoundError(code);
  return row.id;
}

// ── status ──────────────────────────────────────────────────────────

export async function updateLeadStatusUsing(
  deps: LeadMutationDeps,
  ctx: ActorContext,
  code: string,
  newStatus: LeadStatus,
): Promise<WithAuditResult<{ status: LeadStatus }, { status: LeadStatus }>> {
  const leadId = await resolveLeadId(deps, code);
  return withAuditUsing(deps.runTx, {
    actorId: ctx.actorId,
    action: "lead.status.update",
    entity: "Lead",
    entityId: leadId,
    ip: ctx.ip,
    ua: ctx.ua,
    loadBefore: async (tx) => {
      const row = await tx.lead.findUniqueOrThrow({
        where: { id: leadId },
        select: { status: true },
      });
      return { status: row.status };
    },
    mutate: async (tx) => {
      await tx.lead.update({
        where: { id: leadId },
        data: { status: newStatus },
      });
      return { status: newStatus };
    },
  });
}

export function updateLeadStatus(ctx: ActorContext, code: string, newStatus: LeadStatus) {
  return updateLeadStatusUsing(productionDeps, ctx, code, newStatus);
}

// ── owner ───────────────────────────────────────────────────────────

export async function assignLeadOwnerUsing(
  deps: LeadMutationDeps,
  ctx: ActorContext,
  code: string,
  ownerId: string | null,
): Promise<WithAuditResult<{ ownerId: string | null }, { ownerId: string | null }>> {
  const leadId = await resolveLeadId(deps, code);
  return withAuditUsing(deps.runTx, {
    actorId: ctx.actorId,
    action: ownerId === null ? "lead.owner.unassign" : "lead.owner.assign",
    entity: "Lead",
    entityId: leadId,
    ip: ctx.ip,
    ua: ctx.ua,
    loadBefore: async (tx) => {
      const row = await tx.lead.findUniqueOrThrow({
        where: { id: leadId },
        select: { ownerId: true },
      });
      return { ownerId: row.ownerId };
    },
    mutate: async (tx) => {
      await tx.lead.update({ where: { id: leadId }, data: { ownerId } });
      return { ownerId };
    },
  });
}

export function assignLeadOwner(ctx: ActorContext, code: string, ownerId: string | null) {
  return assignLeadOwnerUsing(productionDeps, ctx, code, ownerId);
}

// ── clinic ──────────────────────────────────────────────────────────

export async function assignLeadClinicUsing(
  deps: LeadMutationDeps,
  ctx: ActorContext,
  code: string,
  clinicId: string | null,
): Promise<WithAuditResult<{ clinicId: string | null }, { clinicId: string | null }>> {
  const leadId = await resolveLeadId(deps, code);
  return withAuditUsing(deps.runTx, {
    actorId: ctx.actorId,
    action: clinicId === null ? "lead.clinic.unassign" : "lead.clinic.assign",
    entity: "Lead",
    entityId: leadId,
    ip: ctx.ip,
    ua: ctx.ua,
    loadBefore: async (tx) => {
      const row = await tx.lead.findUniqueOrThrow({
        where: { id: leadId },
        select: { clinicId: true },
      });
      return { clinicId: row.clinicId };
    },
    mutate: async (tx) => {
      await tx.lead.update({ where: { id: leadId }, data: { clinicId } });
      return { clinicId };
    },
  });
}

export function assignLeadClinic(ctx: ActorContext, code: string, clinicId: string | null) {
  return assignLeadClinicUsing(productionDeps, ctx, code, clinicId);
}

// ── note ────────────────────────────────────────────────────────────

/**
 * Note add. Unlike the field mutations above, this creates a new Note
 * row rather than mutating Lead — but the AuditLog entry is still
 * attached to the Lead (entity: "Lead", entityId: lead.id) so the
 * activity log surfaces it alongside status / owner / clinic events.
 * `before` is null (no prior note); `after` carries the note id +
 * body preview so the activity row can render without joining Note.
 */
export async function addLeadNoteUsing(
  deps: LeadMutationDeps,
  ctx: ActorContext,
  code: string,
  body: string,
): Promise<{ noteId: string }> {
  const leadId = await resolveLeadId(deps, code);
  const result = await withAuditUsing<null, { noteId: string; bodyPreview: string }>(deps.runTx, {
    actorId: ctx.actorId,
    action: "lead.note.add",
    entity: "Lead",
    entityId: leadId,
    ip: ctx.ip,
    ua: ctx.ua,
    loadBefore: async () => null,
    mutate: async (tx) => {
      const note = await tx.note.create({
        data: { leadId, authorId: ctx.actorId, body },
        select: { id: true },
      });
      return { noteId: note.id, bodyPreview: body.slice(0, 200) };
    },
  });
  return { noteId: result.after.noteId };
}

export function addLeadNote(ctx: ActorContext, code: string, body: string) {
  return addLeadNoteUsing(productionDeps, ctx, code, body);
}

// ── exports for tests ────────────────────────────────────────────────

export type { Prisma };
