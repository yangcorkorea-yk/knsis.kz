import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStaffSession,
  destroyStaffSession,
  maybeRefreshStaffSession,
  STAFF_COOKIE_ATTRS,
  STAFF_COOKIE_NAME,
  STAFF_ROLES,
  type StaffSessionDeps,
  type StaffSessionRow,
  verifyStaffSession,
} from "./staff-session";

function makeDeps(rows: StaffSessionRow[] = []): {
  deps: StaffSessionDeps;
  create: ReturnType<typeof vi.fn>;
  extend: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  store: Map<string, StaffSessionRow>;
} {
  const store = new Map(rows.map((r) => [r.id, r]));
  const create = vi.fn(
    async (input: { userId: string; expiresAt: Date; ip: string | null; ua: string | null }) => {
      const id = `00000000-0000-4000-8000-${(store.size + 1).toString(16).padStart(12, "0")}`;
      store.set(id, {
        id,
        userId: input.userId,
        expiresAt: input.expiresAt,
        user: { role: Role.manager, deletedAt: null },
      });
      return { id };
    },
  );
  const extend = vi.fn(async (id: string, expiresAt: Date) => {
    const row = store.get(id);
    if (row) store.set(id, { ...row, expiresAt });
  });
  const remove = vi.fn(async (id: string) => {
    store.delete(id);
  });
  const deps: StaffSessionDeps = {
    createSession: create,
    findSession: async (id) => store.get(id) ?? null,
    extendSession: extend,
    deleteSession: remove,
  };
  return { deps, create, extend, remove, store };
}

describe("staff session", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cookie constants match the spec", () => {
    expect(STAFF_COOKIE_NAME).toBe("knsis_staff");
    expect(STAFF_COOKIE_ATTRS.httpOnly).toBe(true);
    expect(STAFF_COOKIE_ATTRS.secure).toBe(true);
    expect(STAFF_COOKIE_ATTRS.sameSite).toBe("lax");
    expect(STAFF_COOKIE_ATTRS.maxAge).toBe(60 * 60 * 24 * 14);
    expect(STAFF_COOKIE_ATTRS.path).toBe("/");
  });

  it("STAFF_ROLES contains exactly support/manager/head/admin", () => {
    expect([...STAFF_ROLES].sort()).toEqual(["admin", "head", "manager", "support"]);
    expect(STAFF_ROLES.has(Role.guest)).toBe(false);
    expect(STAFF_ROLES.has(Role.customer)).toBe(false);
  });

  it("createStaffSession persists a row with expiresAt = now + 14d", async () => {
    const { deps, create } = makeDeps();
    const now = new Date("2026-05-21T00:00:00Z");
    const result = await createStaffSession(deps, { userId: "user-1", now });
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.expiresAt.getTime() - now.getTime()).toBe(14 * 24 * 60 * 60 * 1000);
    expect(result.sessionId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("verifyStaffSession returns the session when row + role are valid", async () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const row: StaffSessionRow = {
      id,
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      user: { role: Role.manager, deletedAt: null },
    };
    const { deps } = makeDeps([row]);
    const session = await verifyStaffSession(deps, id);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe("user-1");
    expect(session?.role).toBe(Role.manager);
  });

  it.each([undefined, null, "", "not-a-uuid", "11111111-1111-1111", "💀"])(
    "verifyStaffSession rejects malformed session id: %j",
    async (bad) => {
      const { deps } = makeDeps();
      expect(await verifyStaffSession(deps, bad as string | undefined | null)).toBeNull();
    },
  );

  it("verifyStaffSession returns null when the row is missing", async () => {
    const { deps } = makeDeps();
    expect(await verifyStaffSession(deps, "22222222-2222-4222-8222-222222222222")).toBeNull();
  });

  it("verifyStaffSession returns null when the row has expired", async () => {
    const id = "33333333-3333-4333-8333-333333333333";
    const row: StaffSessionRow = {
      id,
      userId: "user-1",
      expiresAt: new Date(Date.now() - 1_000),
      user: { role: Role.manager, deletedAt: null },
    };
    const { deps } = makeDeps([row]);
    expect(await verifyStaffSession(deps, id)).toBeNull();
  });

  it("verifyStaffSession returns null when the staff user is soft-deleted", async () => {
    const id = "44444444-4444-4444-8444-444444444444";
    const row: StaffSessionRow = {
      id,
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      user: { role: Role.manager, deletedAt: new Date() },
    };
    const { deps } = makeDeps([row]);
    expect(await verifyStaffSession(deps, id)).toBeNull();
  });

  it.each([Role.guest, Role.customer])(
    "verifyStaffSession returns null when user.role=%s (not a staff role)",
    async (role) => {
      const id = "55555555-5555-4555-8555-555555555555";
      const row: StaffSessionRow = {
        id,
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        user: { role, deletedAt: null },
      };
      const { deps } = makeDeps([row]);
      expect(await verifyStaffSession(deps, id)).toBeNull();
    },
  );

  it("maybeRefreshStaffSession is a no-op when >13d remain", async () => {
    const { deps, extend } = makeDeps();
    const now = new Date("2026-05-21T00:00:00Z");
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const result = await maybeRefreshStaffSession(
      deps,
      { sessionId: "x", userId: "u", role: Role.manager, expiresAt },
      { now },
    );
    expect(result.refreshed).toBe(false);
    expect(result.expiresAt).toEqual(expiresAt);
    expect(extend).not.toHaveBeenCalled();
  });

  it("maybeRefreshStaffSession extends when <=13d remain", async () => {
    const { deps, extend } = makeDeps();
    const now = new Date("2026-05-21T00:00:00Z");
    const expiresAt = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
    const result = await maybeRefreshStaffSession(
      deps,
      { sessionId: "abc", userId: "u", role: Role.manager, expiresAt },
      { now },
    );
    expect(result.refreshed).toBe(true);
    expect(result.expiresAt.getTime() - now.getTime()).toBe(14 * 24 * 60 * 60 * 1000);
    expect(extend).toHaveBeenCalledWith("abc", result.expiresAt);
  });

  it("destroyStaffSession deletes the row", async () => {
    const id = "66666666-6666-4666-8666-666666666666";
    const { deps, remove, store } = makeDeps([
      {
        id,
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        user: { role: Role.manager, deletedAt: null },
      },
    ]);
    await destroyStaffSession(deps, id);
    expect(remove).toHaveBeenCalledWith(id);
    expect(store.has(id)).toBe(false);
  });
});
