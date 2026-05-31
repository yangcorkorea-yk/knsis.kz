/*
 * lib/admin/audit-log.ts — raw AuditLog insert helper.
 *
 * **INTERNAL** — production code paths should NOT call `auditLog`
 * directly. Use `withAudit` instead (lib/admin/with-audit.ts) so the
 * mutation + audit insert share a transaction. Direct callers risk
 * leaving audit rows orphaned from rolled-back mutations (or vice
 * versa), which breaks CLAUDE.md hard rule §5.
 *
 * Action string convention: `entity.field.verb` e.g.
 *   - lead.status.update
 *   - lead.owner.assign
 *   - lead.owner.unassign
 *   - lead.clinic.assign
 *   - lead.clinic.unassign
 *   - lead.note.add
 *
 * Entity is a narrow union so typos at the call site fail typecheck
 * instead of silently writing a row that the activity-log query
 * can't find. `before`/`after` accept `null` at the boundary; we map
 * to `Prisma.DbNull` (SQL NULL) rather than `Prisma.JsonNull` (the
 * JSON literal `null`) since the activity log treats absence as "no
 * prior value" rather than a meaningful JSON null.
 */

import { Prisma } from "@prisma/client";

export type AuditEntity = "Lead" | "Clinic" | "Review" | "User";

export interface AuditLogParams {
  tx: Prisma.TransactionClient;
  actorId: string;
  action: string;
  entity: AuditEntity;
  entityId: string;
  before: Prisma.InputJsonValue | null;
  after: Prisma.InputJsonValue | null;
  ip: string | null;
  ua: string | null;
}

export async function auditLog(params: AuditLogParams): Promise<void> {
  await params.tx.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      before: params.before ?? Prisma.DbNull,
      after: params.after ?? Prisma.DbNull,
      ip: params.ip,
      ua: params.ua,
    },
  });
}
