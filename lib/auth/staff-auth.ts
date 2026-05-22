/*
 * lib/auth/staff-auth.ts — staff sign-in / sign-out orchestration.
 *
 * Pure-function composition over `password` and `staff-session`.
 * The route handlers are thin wrappers that translate a Request
 * into the inputs this module needs and serialise the result back
 * into a Response with cookies set.
 *
 * Every failure path returns the same `{ ok: false, reason: 'invalid_credentials' }`
 * so the route handler can ship one 401 body regardless of which
 * branch failed. The `reason` field is also kept narrow on purpose:
 * callers MUST NOT leak it into the response body (it's there for
 * audit logs / dev breakpoints, not the public surface).
 *
 * Rate limiting is intentionally out of scope here — lands at the
 * middleware layer in M2-01. See TODO below.
 */

import type { Role } from "@prisma/client";
import { verifyPassword } from "./password";
import {
  createStaffSession,
  destroyStaffSession,
  STAFF_ROLES,
  type StaffSessionDeps,
} from "./staff-session";

// TODO(M2-01): wire rate limits at the middleware layer
//   - 5 attempts / IP / 15 min
//   - 10 attempts / email / hour
// signin must remain idempotent under retry; do not add per-call locks here.

export type SigninFailure = {
  ok: false;
  reason: "invalid_credentials";
};

export type SigninSuccess = {
  ok: true;
  sessionId: string;
  expiresAt: Date;
  userId: string;
  role: Role;
};

export type SigninResult = SigninSuccess | SigninFailure;

const FAIL: SigninFailure = { ok: false, reason: "invalid_credentials" };

export interface StaffLookupRow {
  id: string;
  role: Role;
  passwordHash: string | null;
  deletedAt: Date | null;
}

export interface AttemptSigninDeps extends StaffSessionDeps {
  findUserByEmail: (email: string) => Promise<StaffLookupRow | null>;
}

export interface AttemptSigninInput {
  email: string;
  password: string;
  ip?: string | null;
  ua?: string | null;
  now?: Date;
}

/**
 * Verify the credentials, then issue a staff session. Always burns
 * one bcrypt round (via verifyPassword's dummy path) when the user
 * doesn't exist, so a "no such email" lookup is indistinguishable
 * from a "wrong password" lookup by timing.
 *
 * Order of checks (matters for tests):
 *   1. Email format must be present (trivial validation, no round-trip).
 *   2. Find user (or null).
 *   3. verifyPassword(user?.passwordHash, password) — always runs.
 *   4. Reject if no user, if soft-deleted, if passwordHash null, or
 *      if role not in STAFF_ROLES, or if password mismatched.
 *   5. Otherwise issue a session.
 */
export async function attemptSignin(
  deps: AttemptSigninDeps,
  input: AttemptSigninInput,
): Promise<SigninResult> {
  const email = (input.email ?? "").trim().toLowerCase();
  const password = input.password ?? "";

  // Don't even hit the DB for blank inputs — but still spend one
  // bcrypt round so timing stays uniform.
  if (!email || !password) {
    await verifyPassword(null, password);
    return FAIL;
  }

  const user = await deps.findUserByEmail(email);
  const passwordOk = await verifyPassword(user?.passwordHash ?? null, password);

  if (!user) return FAIL;
  if (user.deletedAt) return FAIL;
  if (!user.passwordHash) return FAIL; // guest / customer / un-onboarded staff
  if (!STAFF_ROLES.has(user.role)) return FAIL;
  if (!passwordOk) return FAIL;

  const session = await createStaffSession(deps, {
    userId: user.id,
    ip: input.ip ?? null,
    ua: input.ua ?? null,
    now: input.now,
  });
  return {
    ok: true,
    sessionId: session.sessionId,
    expiresAt: session.expiresAt,
    userId: user.id,
    role: user.role,
  };
}

export async function signOut(
  deps: StaffSessionDeps,
  sessionId: string | undefined | null,
): Promise<void> {
  // Be lenient: the cookie may be malformed/missing on a 'sign out
  // anyway' click. Still clear the row if we can recognise the shape.
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) return;
  await destroyStaffSession(deps, sessionId);
}
