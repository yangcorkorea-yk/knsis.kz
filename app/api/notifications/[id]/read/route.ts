/*
 * POST /api/notifications/[id]/read — mark a single Notification as
 * read AND redirect to the relevant surface.
 *
 * Body is form-encoded (the inbox <form> POST):
 *   returnTo  — fallback URL when there's no deep-link target
 *   leadCode  — when present, redirect to /[locale]/consult/... or
 *               the future chat surface (PR-B). For PR-A the redirect
 *               just sends the user back to the inbox view since
 *               consult tracking pages don't exist yet.
 *
 * Ownership: the lookup re-checks Notification.userId against the
 * cookie's User.id. Hostile id paste returns 403.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { readGuestSession } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

const SAFE_RETURN_RE = /^\/[a-z0-9_/?&=.-]+$/i;

function safeReturnTo(raw: FormDataEntryValue | null): string {
  if (typeof raw === "string" && SAFE_RETURN_RE.test(raw)) return raw;
  return "/";
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guestId = await readGuestSession();
  if (!guestId) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { guestId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const returnTo = safeReturnTo(formData?.get("returnTo") ?? null);

  const res = await markNotificationRead({ id: params.id, userId: user.id });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: res.reason }, { status: 403 });
  }
  // Inbox <form> POSTs receive a 303 redirect back to the inbox
  // (or to the consult drawer in PR-B, when chat ships).
  return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
}
