/*
 * POST /api/notifications/mark-all-read — bulk-clear unread badge.
 *
 * Form-encoded body: { returnTo }. Cookie-resolved User.id scopes
 * the updateMany; no risk of cross-user data poisoning.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { readGuestSession } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

const SAFE_RETURN_RE = /^\/[a-z0-9_/?&=.-]+$/i;

export async function POST(req: Request) {
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
  const returnRaw = formData?.get("returnTo");
  const returnTo =
    typeof returnRaw === "string" && SAFE_RETURN_RE.test(returnRaw) ? returnRaw : "/";

  await markAllNotificationsRead(user.id);
  return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
}
