import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { BCRYPT_COST, hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashPassword produces a bcrypt $2 string at the configured work factor", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$2[aby]\$/);
    // The work-factor field is at index 2 of the hash (e.g. "$2a$12$…").
    const rounds = Number(hash.split("$")[2]);
    expect(rounds).toBe(BCRYPT_COST);
  });

  it("refuses to hash an empty password (fail-fast)", async () => {
    await expect(hashPassword("")).rejects.toThrow(/empty/);
  });

  it("verifyPassword(hash, plain) returns true on match", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword(hash, "hunter2")).toBe(true);
  });

  it("verifyPassword(hash, plain) returns false on mismatch", async () => {
    const hash = await hashPassword("hunter2");
    expect(await verifyPassword(hash, "hunter3")).toBe(false);
  });

  it("verifyPassword(null, plain) returns false (no real user)", async () => {
    expect(await verifyPassword(null, "anything")).toBe(false);
    expect(await verifyPassword(undefined, "anything")).toBe(false);
  });

  it("verifyPassword(null, plain) still does a real bcrypt compare (timing parity)", async () => {
    // We can't reliably assert on wall-clock in CI, but we can prove the
    // function awaits a real compare by spying on bcrypt.compare and
    // checking it was invoked even with a null hash.
    const spy = vi.spyOn(bcrypt, "compare");
    spy.mockClear();
    await verifyPassword(null, "anything");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
