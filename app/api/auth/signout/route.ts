/*
 * POST /api/auth/signout — staff sign-out.
 *
 * Deletes the Session row (revoke-on-server, not just cookie clear)
 * and clears the staff cookie. Idempotent — calling twice or without
 * a session is fine and returns 200.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { signOut } from "@/lib/auth/staff-auth";
import { STAFF_COOKIE_ATTRS, STAFF_COOKIE_NAME } from "@/lib/auth/staff-session";

// Same edge-runtime declaration as signin (Cloudflare Pages requires
// it on every non-static route). The Prisma adapter follow-up applies
// here too.
export const runtime = "edge";

const deps = {
  // signOut() only uses deleteSession; the rest are stubs to satisfy
  // the StaffSessionDeps contract.
  createSession: async () => ({ id: "" }),
  findSession: async () => null,
  extendSession: async () => {},
  deleteSession: (sessionId: string) =>
    prisma.session.delete({ where: { id: sessionId } }).then(() => undefined),
};

export async function POST() {
  const jar = cookies();
  const current = jar.get(STAFF_COOKIE_NAME)?.value;
  try {
    await signOut(deps, current);
  } catch {
    // Row may have been pruned out-of-band — that's fine, we still
    // want to clear the cookie below.
  }
  jar.set({
    name: STAFF_COOKIE_NAME,
    value: "",
    ...STAFF_COOKIE_ATTRS,
    maxAge: 0,
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}
