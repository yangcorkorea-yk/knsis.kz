/*
 * PATCH /api/me/settings — partial update for the current user.
 *
 * Form-encoded body. Accepts any subset of:
 *   locale: "kz" | "ru" | "kr"
 *   email:  string (RFC-ish)
 *   notif_inapp:  "on" | absent
 *   notif_email:  "on" | absent
 *   returnTo: safe path to redirect to
 *
 * Notifications: only fields that the FORM SENDS get updated.
 * Channel toggles ship as checkbox `name="notif_inapp"`/`notif_email`
 * — HTML semantics omit unchecked boxes, so we infer "set channel
 * false" only when the form posted but the checkbox was absent. The
 * inbound payload always includes `_channels_form` as a hidden marker
 * so we know the channel section was the one being submitted.
 *
 * Email validation: RFC-like, lowercased + trimmed before write.
 * Uniqueness handled by Prisma's unique constraint — 409 on conflict.
 */

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readGuestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isLocale } from "@/lib/i18n/config";
import { parseNotifChannels, serializeNotifChannels } from "@/lib/messaging/notif-channels";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_RETURN_RE = /^\/[a-z0-9_/?&=.-]+$/i;
const emailSchema = z.string().trim().toLowerCase().regex(EMAIL_RE);

/**
 * Browser HTML forms support GET and POST only — not PATCH. The
 * settings page POSTs from a `<form method="post">`, so we expose
 * the handler as POST. Programmatic callers (none yet) follow the
 * same shape. JSON-PATCH semantics aren't appropriate here anyway
 * since the form posts a complete section-snapshot, not a diff.
 */
export async function POST(req: Request) {
  const guestId = await readGuestSession();
  if (!guestId) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { guestId },
    select: { id: true, notifChannels: true },
  });
  if (!me) {
    return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, error: "bad_form" }, { status: 400 });
  }
  const returnToRaw = form.get("returnTo");
  const returnTo =
    typeof returnToRaw === "string" && SAFE_RETURN_RE.test(returnToRaw) ? returnToRaw : "/";

  const data: Prisma.UserUpdateInput = {};

  // Locale — only honoured if exact match.
  const localeRaw = form.get("locale");
  if (typeof localeRaw === "string" && isLocale(localeRaw)) {
    data.locale = localeRaw;
  }

  // Email — only updated if the email section was submitted.
  if (form.get("_email_form") === "1") {
    const emailRaw = form.get("email");
    if (typeof emailRaw === "string" && emailRaw.trim().length > 0) {
      const parsed = emailSchema.safeParse(emailRaw);
      if (!parsed.success) {
        const target = new URL(returnTo, req.url);
        target.searchParams.set("err", "email_invalid");
        return NextResponse.redirect(target, { status: 303 });
      }
      data.email = parsed.data;
    } else {
      // Clearing email is explicit: empty string in the input.
      data.email = null;
    }
  }

  // Channels — only updated if the channels section was submitted.
  if (form.get("_channels_form") === "1") {
    const current = parseNotifChannels(me.notifChannels);
    const next = {
      ...current,
      inapp: form.get("notif_inapp") === "on",
      email: form.get("notif_email") === "on",
    };
    data.notifChannels = serializeNotifChannels(next);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
  }

  try {
    await prisma.user.update({ where: { id: me.id }, data });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      Array.isArray(err.meta?.target) &&
      (err.meta?.target as string[]).includes("email")
    ) {
      const target = new URL(returnTo, req.url);
      target.searchParams.set("err", "email_taken");
      return NextResponse.redirect(target, { status: 303 });
    }
    throw err;
  }
  const target = new URL(returnTo, req.url);
  target.searchParams.set("ok", "1");
  return NextResponse.redirect(target, { status: 303 });
}
