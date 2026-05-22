/*
 * lib/auth/require-role.ts — RBAC entry point for server code.
 *
 * Thin composition over verifyStaffSession (M1-03). Reads the
 * staff cookie via next/headers, looks up the session row, and
 * checks the row's role against the caller's allow-list.
 *
 * Returns a discriminated union so the caller decides what to do
 * with each failure mode:
 *
 *   - 401 = no cookie, malformed/expired session, soft-deleted
 *     user, or user.role outside STAFF_ROLES. "You are not a
 *     logged-in staff member."
 *   - 403 = authenticated as staff, but the role isn't on the
 *     allow-list this caller passed. "You are logged in but not
 *     allowed to do this."
 *   - ok = the verified StaffSession.
 *
 * Typical patterns:
 *
 *   // Route handler
 *   const r = await requireRole([Role.admin, Role.head]);
 *   if (!r.ok) return NextResponse.json({ ok: false }, { status: r.status });
 *   // … r.session.userId is safe to use
 *
 *   // Server component / page
 *   const r = await requireRole([Role.admin]);
 *   if (!r.ok) redirect("/signin");
 *
 * Pure form `requireRoleWithDeps` is exported for vitest — composes
 * a fully-injectable variant the same way the M1-02 / M1-03 helpers
 * do.
 */

import type { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import {
  type StaffSession,
  type StaffSessionDeps,
  STAFF_COOKIE_NAME,
  verifyStaffSession,
} from "./staff-session";

export type RequireRoleResult =
  | { ok: true; session: StaffSession }
  | { ok: false; status: 401 | 403 };

/**
 * Pure DI variant. Takes the session id directly + a deps bag (only
 * `findSession` is read), so tests don't need to stub next/headers
 * or Prisma.
 */
export async function requireRoleWithDeps(
  allowed: readonly Role[],
  sessionId: string | undefined | null,
  deps: StaffSessionDeps,
  opts?: { now?: Date },
): Promise<RequireRoleResult> {
  const session = await verifyStaffSession(deps, sessionId, opts);
  if (!session) return { ok: false, status: 401 };
  if (!allowed.includes(session.role)) return { ok: false, status: 403 };
  return { ok: true, session };
}

/**
 * Production wrapper. Reads the staff cookie via next/headers and
 * looks up the session row through Prisma.
 *
 * Dynamic-import-free: the call happens inside an already-dynamic
 * route or server component, so the Prisma client (Node runtime)
 * loads at request time anyway. On Vercel this just works; the
 * Cloudflare driver-adapter detour is no longer needed (see
 * _archive/CHANGES.md "M1-03 · Hosting migration").
 */
export async function requireRole(allowed: readonly Role[]): Promise<RequireRoleResult> {
  const sessionId = cookies().get(STAFF_COOKIE_NAME)?.value;
  const deps: StaffSessionDeps = {
    // Only findSession is exercised by verifyStaffSession; the rest
    // are stubs to satisfy the contract.
    createSession: async () => ({ id: "" }),
    findSession: (id) =>
      prisma.session.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          user: { select: { role: true, deletedAt: true } },
        },
      }),
    extendSession: async () => {},
    deleteSession: async () => {},
  };
  return requireRoleWithDeps(allowed, sessionId, deps);
}
