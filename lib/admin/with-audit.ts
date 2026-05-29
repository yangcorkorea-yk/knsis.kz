/*
 * lib/admin/with-audit.ts — single mutation surface for the admin tree.
 *
 * Every admin mutation MUST go through this helper. It opens a single
 * `prisma.$transaction`, reads the entity's pre-state, runs the
 * caller's mutation, and writes an `AuditLog` row inside the same
 * transaction. If the mutation throws or the audit insert fails, the
 * whole transaction rolls back — the audit log and the data layer
 * cannot drift (CLAUDE.md hard rule §5).
 *
 * Per the spec sign-off (`docs/decisions/m5-batch-1-spec.md` §
 * "withAudit helper"), no-op mutations (`before` deep-equal `after`)
 * skip the audit insert entirely. This avoids log spam from
 * idempotent re-clicks (e.g. setting status to its current value) —
 * the activity log only records real state changes.
 *
 * Future implementers writing `updateLeadFoo` without this helper
 * fail rule §5 on review immediately. The pattern IS the checklist.
 *
 * `withAuditUsing` is the pure DI variant — tests inject a fake
 * transaction runner so they don't need a live Prisma client. The
 * default `withAudit` wraps the prisma global.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { auditLog, type AuditEntity } from "./audit-log";

type Jsonish = string | number | boolean | null | { [k: string]: Jsonish } | readonly Jsonish[];

export interface WithAuditParams<Before extends Jsonish, After extends Jsonish> {
  actorId: string;
  action: string;
  entity: AuditEntity;
  entityId: string;
  ip: string | null;
  ua: string | null;
  loadBefore: (tx: Prisma.TransactionClient) => Promise<Before>;
  mutate: (tx: Prisma.TransactionClient, before: Before) => Promise<After>;
}

export interface WithAuditResult<Before extends Jsonish, After extends Jsonish> {
  before: Before;
  after: After;
  /** True iff the audit-log row was written (i.e. `before !== after`). */
  changed: boolean;
}

/**
 * Stable JSON serialiser for deep-equality. Keys are sorted so two
 * shape-equivalent objects with different insertion order compare
 * equal. Arrays preserve order (semantic difference).
 *
 * Exported for the test suite + downstream callers that want to
 * spot-check no-op detection.
 */
export function stableStringify(value: Jsonish): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const parts = keys.map(
    (k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, Jsonish>)[k]!)}`,
  );
  return `{${parts.join(",")}}`;
}

/**
 * Transaction runner abstraction. In production this is
 * `prisma.$transaction`; in tests it's a fake that hands the callback
 * a stub `tx`.
 */
export type TransactionRunner = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;

export async function withAuditUsing<Before extends Jsonish, After extends Jsonish>(
  runTx: TransactionRunner,
  params: WithAuditParams<Before, After>,
): Promise<WithAuditResult<Before, After>> {
  return runTx(async (tx) => {
    const before = await params.loadBefore(tx);
    const after = await params.mutate(tx, before);

    const changed = stableStringify(before) !== stableStringify(after);
    if (changed) {
      await auditLog({
        tx,
        actorId: params.actorId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        before: before as Prisma.InputJsonValue,
        after: after as Prisma.InputJsonValue,
        ip: params.ip,
        ua: params.ua,
      });
    }
    return { before, after, changed };
  });
}

/** Production wrapper — uses the singleton prisma client. */
export async function withAudit<Before extends Jsonish, After extends Jsonish>(
  params: WithAuditParams<Before, After>,
): Promise<WithAuditResult<Before, After>> {
  const runTx: TransactionRunner = (fn) => (prisma as PrismaClient).$transaction(fn);
  return withAuditUsing(runTx, params);
}
