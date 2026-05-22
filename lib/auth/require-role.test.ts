import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireRoleWithDeps } from "./require-role";
import type { StaffSessionDeps, StaffSessionRow } from "./staff-session";

function makeDeps(row?: StaffSessionRow): StaffSessionDeps {
  return {
    createSession: vi.fn(),
    findSession: vi.fn(async (id) => (row && row.id === id ? row : null)),
    extendSession: vi.fn(),
    deleteSession: vi.fn(),
  };
}

const VALID_ID = "11111111-1111-4111-8111-111111111111";

function rowFor(role: Role, opts: { expired?: boolean; deleted?: boolean } = {}): StaffSessionRow {
  return {
    id: VALID_ID,
    userId: "user-1",
    expiresAt: new Date(opts.expired ? Date.now() - 1_000 : Date.now() + 60_000),
    user: { role, deletedAt: opts.deleted ? new Date() : null },
  };
}

describe("requireRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("missing cookie → 401", async () => {
    const deps = makeDeps();
    const r = await requireRoleWithDeps([Role.admin], undefined, deps);
    expect(r).toEqual({ ok: false, status: 401 });
  });

  it("malformed session id → 401", async () => {
    const deps = makeDeps();
    const r = await requireRoleWithDeps([Role.admin], "not-a-uuid", deps);
    expect(r).toEqual({ ok: false, status: 401 });
  });

  it("well-formed id but row missing in DB → 401", async () => {
    const deps = makeDeps(/* no rows */);
    const r = await requireRoleWithDeps([Role.admin], VALID_ID, deps);
    expect(r).toEqual({ ok: false, status: 401 });
  });

  it("expired row → 401", async () => {
    const deps = makeDeps(rowFor(Role.admin, { expired: true }));
    const r = await requireRoleWithDeps([Role.admin], VALID_ID, deps);
    expect(r).toEqual({ ok: false, status: 401 });
  });

  it("soft-deleted user → 401", async () => {
    const deps = makeDeps(rowFor(Role.admin, { deleted: true }));
    const r = await requireRoleWithDeps([Role.admin], VALID_ID, deps);
    expect(r).toEqual({ ok: false, status: 401 });
  });

  it.each([Role.guest, Role.customer])(
    "non-staff role on the session row (%s) → 401 (verifyStaffSession filters before role check)",
    async (role) => {
      const deps = makeDeps(rowFor(role));
      const r = await requireRoleWithDeps([Role.admin, Role.manager], VALID_ID, deps);
      expect(r).toEqual({ ok: false, status: 401 });
    },
  );

  it("authenticated staff but role NOT in allow-list → 403", async () => {
    const deps = makeDeps(rowFor(Role.support));
    const r = await requireRoleWithDeps([Role.admin, Role.head], VALID_ID, deps);
    expect(r).toEqual({ ok: false, status: 403 });
  });

  it("authenticated staff with allowed role → ok + session passthrough", async () => {
    const deps = makeDeps(rowFor(Role.manager));
    const r = await requireRoleWithDeps(
      [Role.admin, Role.head, Role.manager, Role.support],
      VALID_ID,
      deps,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.userId).toBe("user-1");
    expect(r.session.role).toBe(Role.manager);
    expect(r.session.sessionId).toBe(VALID_ID);
  });

  it("empty allow-list → 403 even for a valid staff session (defensive)", async () => {
    const deps = makeDeps(rowFor(Role.admin));
    const r = await requireRoleWithDeps([], VALID_ID, deps);
    expect(r).toEqual({ ok: false, status: 403 });
  });

  it("allow-list with a non-staff role never matches (because verifyStaffSession already rejects)", async () => {
    // role=guest never survives verifyStaffSession, so even an allow-list
    // containing `guest` can't grant access.
    const deps = makeDeps(rowFor(Role.guest));
    const r = await requireRoleWithDeps([Role.guest, Role.admin], VALID_ID, deps);
    expect(r).toEqual({ ok: false, status: 401 });
  });

  it("forwards the `now` clock to verifyStaffSession for deterministic expiry checks", async () => {
    const row = rowFor(Role.manager);
    row.expiresAt = new Date("2026-06-04T00:00:00Z");
    const deps = makeDeps(row);

    const before = await requireRoleWithDeps([Role.manager], VALID_ID, deps, {
      now: new Date("2026-06-03T00:00:00Z"),
    });
    expect(before.ok).toBe(true);

    const after = await requireRoleWithDeps([Role.manager], VALID_ID, deps, {
      now: new Date("2026-06-05T00:00:00Z"),
    });
    expect(after).toEqual({ ok: false, status: 401 });
  });
});
