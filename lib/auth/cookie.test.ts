import { describe, expect, it } from "vitest";
import {
  GUEST_COOKIE_ATTRS,
  GUEST_COOKIE_NAME,
  newGuestId,
  signGuestCookie,
  verifyGuestCookie,
} from "./cookie";

const SECRET = "test-secret-do-not-use-in-prod";

describe("guest cookie", () => {
  it("name and attributes match the M1-01 spec", () => {
    expect(GUEST_COOKIE_NAME).toBe("knsis_guest");
    expect(GUEST_COOKIE_ATTRS.httpOnly).toBe(true);
    expect(GUEST_COOKIE_ATTRS.secure).toBe(true);
    expect(GUEST_COOKIE_ATTRS.sameSite).toBe("lax");
    expect(GUEST_COOKIE_ATTRS.path).toBe("/");
    expect(GUEST_COOKIE_ATTRS.maxAge).toBe(60 * 60 * 24 * 365);
  });

  it("newGuestId returns a UUID v4", () => {
    const id = newGuestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("sign + verify roundtrip recovers the original guestId", async () => {
    const id = newGuestId();
    const cookie = await signGuestCookie(id, SECRET);
    expect(cookie).toMatch(/^[0-9a-f-]{36}\..+$/);
    expect(await verifyGuestCookie(cookie, SECRET)).toBe(id);
  });

  it("rejects a tampered guestId payload", async () => {
    const id = newGuestId();
    const cookie = await signGuestCookie(id, SECRET);
    const [, sig] = cookie.split(".");
    const tamperedId = newGuestId();
    const tampered = `${tamperedId}.${sig}`;
    expect(await verifyGuestCookie(tampered, SECRET)).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const id = newGuestId();
    const cookie = await signGuestCookie(id, SECRET);
    const tampered = cookie.slice(0, -2) + "AA";
    expect(await verifyGuestCookie(tampered, SECRET)).toBeNull();
  });

  it("rejects a cookie signed with a different secret", async () => {
    const id = newGuestId();
    const cookie = await signGuestCookie(id, SECRET);
    expect(await verifyGuestCookie(cookie, "wrong-secret")).toBeNull();
  });

  it.each([
    undefined,
    "",
    "no-dot",
    ".only-sig",
    "only-id.",
    "not-a-uuid.AAAA",
    "deadbeef-1234-1234-1234-deadbeefcafe.not_base64!!!",
  ])("returns null for malformed input: %j", async (input) => {
    expect(await verifyGuestCookie(input, SECRET)).toBeNull();
  });

  it("returns null when the secret is empty", async () => {
    const id = newGuestId();
    const cookie = await signGuestCookie(id, SECRET);
    expect(await verifyGuestCookie(cookie, "")).toBeNull();
  });

  it("signGuestCookie throws if secret is empty (callers should fail fast)", async () => {
    await expect(signGuestCookie("any", "")).rejects.toThrow(/GUEST_COOKIE_SECRET/);
  });
});
