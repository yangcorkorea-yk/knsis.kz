/*
 * lib/auth/password.ts — staff password hashing + verification.
 *
 * Pure-JS bcryptjs so the same module runs on Node and on Cloudflare
 * Pages edge functions (bcryptjs has no native binding). Work factor
 * is pinned at 12 — ~250 ms / hash on modern hardware, the OWASP
 * floor for bcrypt at the time of writing.
 *
 * `verifyPassword(hash, plain)` always runs a real bcrypt compare,
 * even when the stored hash is null (no staff row, or a guest user).
 * This is the timing-attack mitigation: a "no such user" response
 * takes the same wall-clock as a "wrong password" response.
 *
 * Hash format is `$2a$12$…` (bcrypt). Forward-compatible — a future
 * upgrade to argon2 would expose a new verify() that detects the
 * `$argon2id$` prefix and re-routes; same call sites unchanged.
 */

import bcrypt from "bcryptjs";

export const BCRYPT_COST = 12;

/** Lazy-init dummy hash; first call costs one hash, subsequent are free. */
let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash("__dummy_password_for_timing_only__", BCRYPT_COST);
  }
  return dummyHashPromise;
}

export async function hashPassword(plain: string): Promise<string> {
  if (!plain) throw new Error("hashPassword: refusing to hash an empty string");
  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Always returns boolean, never throws on null/missing hash. When the
 * stored hash is null we still burn one bcrypt round against a dummy
 * so the response time doesn't leak whether the email exists.
 */
export async function verifyPassword(
  storedHash: string | null | undefined,
  plain: string,
): Promise<boolean> {
  if (!storedHash) {
    // Don't short-circuit: do a real-shaped compare against a dummy.
    await bcrypt.compare(plain, await getDummyHash());
    return false;
  }
  return bcrypt.compare(plain, storedHash);
}
