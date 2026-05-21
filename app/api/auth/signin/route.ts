/*
 * POST /api/auth/signin — staff email + password sign-in.
 *
 * Thin wrapper over lib/auth/staff-auth.attemptSignin. All real logic
 * (DB lookup, timing-safe bcrypt, role check, session issue) lives in
 * the helper so it's vitest-covered without simulating a Request.
 *
 * Response shape (deliberately minimal — no `reason` leaks):
 *   200 { ok: true }    + Set-Cookie: knsis_staff=<sessionId>; ...
 *   400 { ok: false }   — malformed JSON body
 *   401 { ok: false }   — any auth failure
 *
 * On a 200 the response also clears the guest cookie (knsis_guest) so
 * the post-signin browser doesn't carry two identities.
 */

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { GUEST_COOKIE_NAME } from "@/lib/auth/cookie";
import { prisma } from "@/lib/db/client";
import { attemptSignin, type AttemptSigninDeps } from "@/lib/auth/staff-auth";
import { STAFF_COOKIE_ATTRS, STAFF_COOKIE_NAME } from "@/lib/auth/staff-session";

// Cloudflare Pages requires every non-static route to declare its
// runtime. We run on the Workers edge runtime (the nodejs_compat
// flag in wrangler.toml shims Node built-ins). NOTE: Prisma Client's
// default engine does NOT yet work on Workers — runtime breakage at
// the first DB call is expected until a driver adapter lands. See
// _archive/CHANGES.md "M1-03 follow-up" for the options being weighed.
export const runtime = "edge";

const deps: AttemptSigninDeps = {
  findUserByEmail: (email) =>
    prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true, deletedAt: true },
    }),
  createSession: ({ userId, expiresAt, ip, ua }) =>
    prisma.session.create({
      data: { userId, expiresAt, ip, ua },
      select: { id: true },
    }),
  findSession: async () => null, // not used by signin
  extendSession: async () => {}, // not used by signin
  deleteSession: async () => {}, // not used by signin
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const raw = (body ?? {}) as { email?: unknown; password?: unknown };
  const email = raw.email;
  const password = raw.password;

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const hdrs = headers();
  const result = await attemptSignin(deps, {
    email,
    password,
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    ua: hdrs.get("user-agent"),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const jar = cookies();
  jar.set({
    name: STAFF_COOKIE_NAME,
    value: result.sessionId,
    ...STAFF_COOKIE_ATTRS,
  });
  // Replace the guest cookie if the same browser was tracking one.
  jar.set({
    name: GUEST_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
