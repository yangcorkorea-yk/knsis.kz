/*
 * POST /api/me/delete — soft-delete the current user.
 *
 * Form-encoded body: { confirm: "DELETE", returnTo? }. The confirm
 * token guards against accidental POSTs (CSRF + same-origin browser
 * forms still require the typed literal). On success:
 *   1. User.deletedAt = now (preserves PII for audit-record period
 *      but no new sessions / forms resolve against this guestId)
 *   2. Clears the guest cookie
 *   3. Redirects to /[locale]/ (home)
 *
 * NOT a hard DELETE — Lead / KoreaVisit / Note / AuditLog rows stay
 * to preserve consent + audit trail. M-POST data-retention runbook
 * (deferred) will pick up the schedule for purging after legal hold.
 */

import { NextResponse } from "next/server";
import { readGuestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { GUEST_COOKIE_ATTRS, GUEST_COOKIE_NAME } from "@/lib/auth/cookie";

export const dynamic = "force-dynamic";

const CONFIRM_TOKEN = "DELETE";
const SAFE_RETURN_RE = /^\/[a-z0-9_/?&=.-]+$/i;

export async function POST(req: Request) {
  const guestId = await readGuestSession();
  if (!guestId) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { guestId },
    select: { id: true },
  });
  if (!me) {
    return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const confirm = form?.get("confirm");
  if (confirm !== CONFIRM_TOKEN) {
    return NextResponse.json({ ok: false, error: "missing_confirm" }, { status: 400 });
  }

  const returnRaw = form?.get("returnTo");
  const returnTo =
    typeof returnRaw === "string" && SAFE_RETURN_RE.test(returnRaw) ? returnRaw : "/";

  await prisma.user.update({
    where: { id: me.id },
    data: { deletedAt: new Date() },
  });

  const res = NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
  res.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: "",
    ...GUEST_COOKIE_ATTRS,
    maxAge: 0,
  });
  return res;
}
