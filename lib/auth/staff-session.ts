/*
 * lib/auth/staff-session.ts — DB-backed staff sessions.
 *
 * - Cookie carries the Session row id (uuid v4, ~122 bits entropy) only.
 *   Lookup happens server-side. No userId or role leaks into the cookie.
 * - TTL = 14 days, with sliding refresh capped to once / 24 h to avoid
 *   a Session update on every request.
 * - signOut deletes the row (revoke-on-server). Useful for the
 *   "log out everywhere" workflow once /me ships in M1-05.
 * - Staff roles are restricted to support / manager / head / admin.
 *   role=guest and role=customer can never own a staff session — that
 *   check lives here so every consumer (route handlers, requireRole
 *   helper in M1-04) inherits it.
 */

import { Role } from "@prisma/client";

export const STAFF_COOKIE_NAME = "knsis_staff";

export const STAFF_COOKIE_ATTRS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 14, // 14 days
} as const;

export const STAFF_ROLES: ReadonlySet<Role> = new Set<Role>([
  Role.support,
  Role.manager,
  Role.head,
  Role.admin,
]);

const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const REFRESH_SKIP_MS = 24 * 60 * 60 * 1000; // skip refresh if >13 days remain

export interface StaffSessionRow {
  id: string;
  userId: string;
  expiresAt: Date;
  user: { role: Role; deletedAt: Date | null };
}

export interface StaffSession {
  sessionId: string;
  userId: string;
  role: Role;
  expiresAt: Date;
}

/** Dependency-injected I/O — keeps the helpers easy to unit-test. */
export interface StaffSessionDeps {
  createSession: (input: {
    userId: string;
    expiresAt: Date;
    ip: string | null;
    ua: string | null;
  }) => Promise<{ id: string }>;
  findSession: (sessionId: string) => Promise<StaffSessionRow | null>;
  extendSession: (sessionId: string, expiresAt: Date) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

/** Issue a fresh session for an already-authenticated staff user. */
export async function createStaffSession(
  deps: StaffSessionDeps,
  input: { userId: string; ip?: string | null; ua?: string | null; now?: Date },
): Promise<{ sessionId: string; expiresAt: Date }> {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  const row = await deps.createSession({
    userId: input.userId,
    expiresAt,
    ip: input.ip ?? null,
    ua: input.ua ?? null,
  });
  return { sessionId: row.id, expiresAt };
}

/**
 * Look up + validate a session id from a cookie. Returns null on any
 * failure path so callers can treat the result as "authenticated staff"
 * or "anonymous":
 *
 *   - id format unrecognised → null
 *   - row missing → null
 *   - row expired → null (caller may also choose to delete it)
 *   - user soft-deleted → null
 *   - user.role not in STAFF_ROLES → null
 */
export async function verifyStaffSession(
  deps: StaffSessionDeps,
  sessionId: string | undefined | null,
  opts?: { now?: Date },
): Promise<StaffSession | null> {
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const row = await deps.findSession(sessionId);
  if (!row) return null;
  const now = opts?.now ?? new Date();
  if (row.expiresAt.getTime() <= now.getTime()) return null;
  if (row.user.deletedAt) return null;
  if (!STAFF_ROLES.has(row.user.role)) return null;
  return {
    sessionId: row.id,
    userId: row.userId,
    role: row.user.role,
    expiresAt: row.expiresAt,
  };
}

/**
 * Sliding refresh — bumps the expiry to now + TTL_MS, but only if the
 * current row would otherwise expire within REFRESH_SKIP_MS. Returns
 * the (possibly unchanged) `expiresAt` so the caller can re-issue the
 * cookie with the right Max-Age.
 */
export async function maybeRefreshStaffSession(
  deps: StaffSessionDeps,
  session: StaffSession,
  opts?: { now?: Date },
): Promise<{ expiresAt: Date; refreshed: boolean }> {
  const now = opts?.now ?? new Date();
  const remaining = session.expiresAt.getTime() - now.getTime();
  if (remaining > TTL_MS - REFRESH_SKIP_MS) {
    return { expiresAt: session.expiresAt, refreshed: false };
  }
  const next = new Date(now.getTime() + TTL_MS);
  await deps.extendSession(session.sessionId, next);
  return { expiresAt: next, refreshed: true };
}

export async function destroyStaffSession(
  deps: StaffSessionDeps,
  sessionId: string,
): Promise<void> {
  await deps.deleteSession(sessionId);
}
