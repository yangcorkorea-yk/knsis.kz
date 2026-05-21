import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "./password";
import { type AttemptSigninDeps, attemptSignin, signOut, type StaffLookupRow } from "./staff-auth";

function makeDeps(rows: Record<string, StaffLookupRow> = {}): {
  deps: AttemptSigninDeps;
  createSpy: ReturnType<typeof vi.fn>;
  findSpy: ReturnType<typeof vi.fn>;
  deleteSpy: ReturnType<typeof vi.fn>;
} {
  const createSpy = vi.fn(async (input: { userId: string; expiresAt: Date }) => ({
    id: `session-for-${input.userId}`,
  }));
  const findSpy = vi.fn(async (email: string) => rows[email] ?? null);
  const deleteSpy = vi.fn(async () => {});
  const deps: AttemptSigninDeps = {
    findUserByEmail: findSpy,
    createSession: createSpy,
    findSession: async () => null,
    extendSession: async () => {},
    deleteSession: deleteSpy,
  };
  return { deps, createSpy, findSpy, deleteSpy };
}

describe("attemptSignin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("(a) correct email + password for a staff user → ok + session issued", async () => {
    const hash = await hashPassword("hunter2");
    const { deps, createSpy } = makeDeps({
      "manager@knsis.kz": {
        id: "user-manager",
        role: Role.manager,
        passwordHash: hash,
        deletedAt: null,
      },
    });
    const r = await attemptSignin(deps, {
      email: "manager@knsis.kz",
      password: "hunter2",
      ip: "127.0.0.1",
      ua: "PlaywrightBot",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.userId).toBe("user-manager");
    expect(r.role).toBe(Role.manager);
    expect(r.sessionId).toBe("session-for-user-manager");
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy.mock.calls[0]![0]).toMatchObject({
      userId: "user-manager",
      ip: "127.0.0.1",
      ua: "PlaywrightBot",
    });
  });

  it("(b) wrong password → invalid_credentials, no session created", async () => {
    const hash = await hashPassword("hunter2");
    const { deps, createSpy } = makeDeps({
      "manager@knsis.kz": {
        id: "user-manager",
        role: Role.manager,
        passwordHash: hash,
        deletedAt: null,
      },
    });
    const r = await attemptSignin(deps, {
      email: "manager@knsis.kz",
      password: "hunter3",
    });
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("(c) email not in DB → invalid_credentials, same shape as wrong-password (no enumeration)", async () => {
    const { deps, createSpy, findSpy } = makeDeps({});
    const r = await attemptSignin(deps, {
      email: "ghost@knsis.kz",
      password: "anything",
    });
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(findSpy).toHaveBeenCalledWith("ghost@knsis.kz");
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("(d) user exists but passwordHash is null (guest, un-onboarded) → invalid_credentials", async () => {
    const { deps, createSpy } = makeDeps({
      "guest@knsis.kz": {
        id: "user-guest",
        role: Role.guest,
        passwordHash: null,
        deletedAt: null,
      },
    });
    const r = await attemptSignin(deps, {
      email: "guest@knsis.kz",
      password: "anything",
    });
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("(e) role=customer with valid passwordHash + correct password → invalid_credentials (not a staff role)", async () => {
    const hash = await hashPassword("hunter2");
    const { deps, createSpy } = makeDeps({
      "customer@knsis.kz": {
        id: "user-customer",
        role: Role.customer,
        passwordHash: hash,
        deletedAt: null,
      },
    });
    const r = await attemptSignin(deps, {
      email: "customer@knsis.kz",
      password: "hunter2",
    });
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("(g) role=guest with valid passwordHash + correct password → invalid_credentials", async () => {
    // Theoretically impossible (guests never set a password) but the
    // role check should still hold even if a bad seed slips through.
    const hash = await hashPassword("hunter2");
    const { deps, createSpy } = makeDeps({
      "guest2@knsis.kz": {
        id: "user-guest2",
        role: Role.guest,
        passwordHash: hash,
        deletedAt: null,
      },
    });
    const r = await attemptSignin(deps, {
      email: "guest2@knsis.kz",
      password: "hunter2",
    });
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("soft-deleted staff user → invalid_credentials", async () => {
    const hash = await hashPassword("hunter2");
    const { deps, createSpy } = makeDeps({
      "ex@knsis.kz": {
        id: "user-ex",
        role: Role.manager,
        passwordHash: hash,
        deletedAt: new Date(),
      },
    });
    const r = await attemptSignin(deps, { email: "ex@knsis.kz", password: "hunter2" });
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(createSpy).not.toHaveBeenCalled();
  });

  it("email is normalised: trimmed + lowercased before lookup", async () => {
    const hash = await hashPassword("hunter2");
    const { deps, findSpy } = makeDeps({
      "manager@knsis.kz": {
        id: "user-manager",
        role: Role.manager,
        passwordHash: hash,
        deletedAt: null,
      },
    });
    const r = await attemptSignin(deps, {
      email: "  Manager@KNSIS.kz  ",
      password: "hunter2",
    });
    expect(r.ok).toBe(true);
    expect(findSpy).toHaveBeenCalledWith("manager@knsis.kz");
  });

  it("blank email or password → invalid_credentials without hitting DB", async () => {
    const { deps, findSpy, createSpy } = makeDeps({});
    expect(await attemptSignin(deps, { email: "", password: "x" })).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
    expect(await attemptSignin(deps, { email: "a@b.c", password: "" })).toEqual({
      ok: false,
      reason: "invalid_credentials",
    });
    expect(findSpy).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  beforeEach(() => vi.clearAllMocks());

  it("(f) deletes the session row when the id is well-formed", async () => {
    const { deps, deleteSpy } = makeDeps();
    await signOut(deps, "11111111-1111-4111-8111-111111111111");
    expect(deleteSpy).toHaveBeenCalledWith("11111111-1111-4111-8111-111111111111");
  });

  it.each([undefined, null, "", "not-a-uuid"])(
    "is a no-op for malformed input: %j",
    async (input) => {
      const { deps, deleteSpy } = makeDeps();
      await signOut(deps, input as string | undefined | null);
      expect(deleteSpy).not.toHaveBeenCalled();
    },
  );
});
