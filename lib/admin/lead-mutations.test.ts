/*
 * lib/admin/lead-mutations.test.ts — verify each mutation lines up
 * the right (action, entity, before/after, audit invariants) so the
 * activity-log surface stays consistent.
 *
 * Pure DI via `*Using` variants — no live Prisma.
 */

import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  addLeadNoteUsing,
  assignLeadClinicUsing,
  assignLeadOwnerUsing,
  LeadNotFoundError,
  updateLeadStatusUsing,
  type LeadMutationDeps,
} from "./lead-mutations";

const LEAD_ID = "11111111-1111-4111-8111-111111111111";
const ACTOR_ID = "22222222-2222-4222-8222-222222222222";
const OWNER_ID = "33333333-3333-4333-8333-333333333333";
const CLINIC_ID = "44444444-4444-4444-8444-444444444444";
const NOTE_ID = "55555555-5555-4555-8555-555555555555";

const ACTOR = { actorId: ACTOR_ID, ip: "1.1.1.1", ua: "test" };

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

interface LeadRow {
  status?: string;
  ownerId?: string | null;
  clinicId?: string | null;
}

function makeDeps(initial: LeadRow): {
  deps: LeadMutationDeps;
  audit: FakeAuditRow[];
  leadUpdate: ReturnType<typeof vi.fn>;
  noteCreate: ReturnType<typeof vi.fn>;
  current: LeadRow;
} {
  const audit: FakeAuditRow[] = [];
  const current: LeadRow = { ...initial };

  const leadUpdate = vi.fn(async ({ data }: { data: Partial<LeadRow> }) => {
    Object.assign(current, data);
    return { id: LEAD_ID };
  });
  const noteCreate = vi.fn(async () => ({ id: NOTE_ID }));

  const tx = {
    lead: {
      findUniqueOrThrow: async () => ({ ...current }),
      update: leadUpdate,
    },
    note: { create: noteCreate },
    auditLog: {
      create: async ({ data }: { data: FakeAuditRow }) => {
        audit.push(data);
        return { id: `audit-${audit.length}` };
      },
    },
  } as unknown as Prisma.TransactionClient;

  const deps: LeadMutationDeps = {
    findLeadIdByCode: vi.fn(async () => ({ id: LEAD_ID })),
    runTx: async (fn) => fn(tx),
  };
  return { deps, audit, leadUpdate, noteCreate, current };
}

describe("LeadNotFoundError", () => {
  it("is raised when the code does not resolve", async () => {
    const deps: LeadMutationDeps = {
      findLeadIdByCode: async () => null,
      runTx: async (fn) => fn({} as unknown as Prisma.TransactionClient),
    };
    await expect(
      updateLeadStatusUsing(deps, ACTOR, "KB-2026-9999", "contacted"),
    ).rejects.toBeInstanceOf(LeadNotFoundError);
  });
});

describe("updateLeadStatus", () => {
  it("writes audit with action=lead.status.update + before/after diff", async () => {
    const { deps, audit, leadUpdate } = makeDeps({ status: "new" });
    const res = await updateLeadStatusUsing(deps, ACTOR, "KB-1", "contacted");

    expect(res.changed).toBe(true);
    expect(leadUpdate).toHaveBeenCalledWith({
      where: { id: LEAD_ID },
      data: { status: "contacted" },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      actorId: ACTOR_ID,
      action: "lead.status.update",
      entity: "Lead",
      entityId: LEAD_ID,
      before: { status: "new" },
      after: { status: "contacted" },
    });
  });

  it("skips audit on no-op (same status)", async () => {
    const { deps, audit } = makeDeps({ status: "contacted" });
    const res = await updateLeadStatusUsing(deps, ACTOR, "KB-1", "contacted");
    expect(res.changed).toBe(false);
    expect(audit).toHaveLength(0);
  });
});

describe("assignLeadOwner", () => {
  it("assign: action=lead.owner.assign", async () => {
    const { deps, audit } = makeDeps({ ownerId: null });
    const res = await assignLeadOwnerUsing(deps, ACTOR, "KB-1", OWNER_ID);
    expect(res.changed).toBe(true);
    expect(audit[0]?.action).toBe("lead.owner.assign");
    expect(audit[0]?.before).toEqual({ ownerId: null });
    expect(audit[0]?.after).toEqual({ ownerId: OWNER_ID });
  });

  it("unassign (null): action=lead.owner.unassign", async () => {
    const { deps, audit } = makeDeps({ ownerId: OWNER_ID });
    const res = await assignLeadOwnerUsing(deps, ACTOR, "KB-1", null);
    expect(res.changed).toBe(true);
    expect(audit[0]?.action).toBe("lead.owner.unassign");
    expect(audit[0]?.before).toEqual({ ownerId: OWNER_ID });
    expect(audit[0]?.after).toEqual({ ownerId: null });
  });

  it("skips audit when reassigning the same owner", async () => {
    const { deps, audit } = makeDeps({ ownerId: OWNER_ID });
    const res = await assignLeadOwnerUsing(deps, ACTOR, "KB-1", OWNER_ID);
    expect(res.changed).toBe(false);
    expect(audit).toHaveLength(0);
  });
});

describe("assignLeadClinic", () => {
  it("assign: action=lead.clinic.assign", async () => {
    const { deps, audit } = makeDeps({ clinicId: null });
    await assignLeadClinicUsing(deps, ACTOR, "KB-1", CLINIC_ID);
    expect(audit[0]?.action).toBe("lead.clinic.assign");
    expect(audit[0]?.after).toEqual({ clinicId: CLINIC_ID });
  });

  it("unassign: action=lead.clinic.unassign", async () => {
    const { deps, audit } = makeDeps({ clinicId: CLINIC_ID });
    await assignLeadClinicUsing(deps, ACTOR, "KB-1", null);
    expect(audit[0]?.action).toBe("lead.clinic.unassign");
    expect(audit[0]?.after).toEqual({ clinicId: null });
  });
});

describe("addLeadNote", () => {
  it("creates a Note row and an audit entry with action=lead.note.add", async () => {
    const { deps, audit, noteCreate } = makeDeps({});
    const { noteId } = await addLeadNoteUsing(deps, ACTOR, "KB-1", "follow-up next Tuesday");

    expect(noteId).toBe(NOTE_ID);
    expect(noteCreate).toHaveBeenCalledWith({
      data: { leadId: LEAD_ID, authorId: ACTOR_ID, body: "follow-up next Tuesday" },
      select: { id: true },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.action).toBe("lead.note.add");
    expect(audit[0]?.entity).toBe("Lead");
    expect(audit[0]?.entityId).toBe(LEAD_ID);
    // `before` is null at the caller boundary; audit-log.ts maps that
    // to `Prisma.DbNull` (the SQL NULL sentinel) for the JSON column.
    expect(audit[0]?.before).toBe(Prisma.DbNull);
    expect(audit[0]?.after).toMatchObject({
      noteId: NOTE_ID,
      bodyPreview: "follow-up next Tuesday",
    });
  });

  it("truncates note body in audit preview to 200 chars", async () => {
    const { deps, audit } = makeDeps({});
    const long = "x".repeat(500);
    await addLeadNoteUsing(deps, ACTOR, "KB-1", long);
    const after = audit[0]?.after as { bodyPreview: string };
    expect(after.bodyPreview.length).toBe(200);
  });
});
