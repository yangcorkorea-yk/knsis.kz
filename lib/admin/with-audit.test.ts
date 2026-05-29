/*
 * lib/admin/with-audit.test.ts — rule §5 regression lock.
 *
 * These tests are the single thing standing between hard rule §5
 * ("audit log every admin mutation") and a regression where a future
 * mutation function quietly skips the audit insert. They cover:
 *
 *   - the stable-string serialiser (no-op detection foundation)
 *   - withAuditUsing happy path (audit row written via the tx)
 *   - no-op skip (before === after, no audit insert)
 *   - mutate-throws rollback (callback inside transaction surfaces
 *     the error; nothing escapes the runTx boundary)
 *   - loadBefore-throws rollback (same shape, earlier failure point)
 *   - audit-insert-throws rollback (insert error reaches caller)
 *
 * No live Prisma needed — `withAuditUsing` takes a transaction
 * runner; the test stubs it with an in-memory tx whose `auditLog`
 * table is a vi.fn array.
 */

import type { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { stableStringify, withAuditUsing, type TransactionRunner } from "./with-audit";

interface FakeAuditRow {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  ua: string | null;
}

function makeRunner() {
  const rows: FakeAuditRow[] = [];
  const create = vi.fn(async ({ data }: { data: FakeAuditRow }) => {
    rows.push(data);
    return { id: `audit-${rows.length}` };
  });
  const tx = { auditLog: { create } } as unknown as Prisma.TransactionClient;
  const runTx: TransactionRunner = async (fn) => fn(tx);
  return { rows, create, tx, runTx };
}

describe("stableStringify", () => {
  it("serialises primitives consistently with JSON.stringify", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify("x")).toBe('"x"');
    expect(stableStringify(true)).toBe("true");
  });

  it("sorts object keys so insertion order doesn't affect equality", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });

  it("preserves array order (sequence is semantic)", () => {
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]));
  });

  it("recursively sorts nested object keys", () => {
    const a = stableStringify({ outer: { z: 1, a: 2 }, top: 3 });
    const b = stableStringify({ top: 3, outer: { a: 2, z: 1 } });
    expect(a).toBe(b);
  });
});

describe("withAuditUsing — rule §5 enforcement", () => {
  it("writes one audit row on a real change", async () => {
    const { rows, create, runTx } = makeRunner();
    const res = await withAuditUsing(runTx, {
      actorId: "actor-1",
      action: "lead.status.update",
      entity: "Lead",
      entityId: "lead-1",
      ip: "1.2.3.4",
      ua: "test/1",
      loadBefore: async () => ({ status: "new" }),
      mutate: async () => ({ status: "contacted" }),
    });

    expect(res.changed).toBe(true);
    expect(res.before).toEqual({ status: "new" });
    expect(res.after).toEqual({ status: "contacted" });
    expect(create).toHaveBeenCalledTimes(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actorId: "actor-1",
      action: "lead.status.update",
      entity: "Lead",
      entityId: "lead-1",
      before: { status: "new" },
      after: { status: "contacted" },
      ip: "1.2.3.4",
      ua: "test/1",
    });
  });

  it("skips the audit insert when before deep-equals after (no-op click)", async () => {
    const { rows, create, runTx } = makeRunner();
    const res = await withAuditUsing(runTx, {
      actorId: "actor-1",
      action: "lead.status.update",
      entity: "Lead",
      entityId: "lead-1",
      ip: null,
      ua: null,
      loadBefore: async () => ({ status: "new" }),
      mutate: async () => ({ status: "new" }),
    });

    expect(res.changed).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(rows).toHaveLength(0);
  });

  it("treats key-order differences as no-op (stable equality)", async () => {
    const { create, runTx } = makeRunner();
    const res = await withAuditUsing(runTx, {
      actorId: "actor-1",
      action: "lead.owner.assign",
      entity: "Lead",
      entityId: "lead-1",
      ip: null,
      ua: null,
      loadBefore: async () => ({ a: 1, b: 2 }),
      mutate: async () => ({ b: 2, a: 1 }),
    });
    expect(res.changed).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("propagates mutate() errors and writes no audit row", async () => {
    const { create, runTx } = makeRunner();
    await expect(
      withAuditUsing(runTx, {
        actorId: "actor-1",
        action: "lead.status.update",
        entity: "Lead",
        entityId: "lead-1",
        ip: null,
        ua: null,
        loadBefore: async () => ({ status: "new" }),
        mutate: async () => {
          throw new Error("db boom");
        },
      }),
    ).rejects.toThrow("db boom");
    expect(create).not.toHaveBeenCalled();
  });

  it("propagates loadBefore() errors and writes no audit row", async () => {
    const { create, runTx } = makeRunner();
    await expect(
      withAuditUsing(runTx, {
        actorId: "actor-1",
        action: "lead.status.update",
        entity: "Lead",
        entityId: "lead-1",
        ip: null,
        ua: null,
        loadBefore: async () => {
          throw new Error("entity missing");
        },
        mutate: async () => ({ status: "contacted" }),
      }),
    ).rejects.toThrow("entity missing");
    expect(create).not.toHaveBeenCalled();
  });

  it("surfaces audit-insert errors so the transaction rolls back", async () => {
    const create = vi.fn(async () => {
      throw new Error("audit insert failed");
    });
    const tx = { auditLog: { create } } as unknown as Prisma.TransactionClient;
    const runTx: TransactionRunner = async (fn) => fn(tx);

    await expect(
      withAuditUsing(runTx, {
        actorId: "actor-1",
        action: "lead.status.update",
        entity: "Lead",
        entityId: "lead-1",
        ip: null,
        ua: null,
        loadBefore: async () => ({ status: "new" }),
        mutate: async () => ({ status: "contacted" }),
      }),
    ).rejects.toThrow("audit insert failed");
  });
});
