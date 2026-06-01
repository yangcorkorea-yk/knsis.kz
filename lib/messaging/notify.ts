/*
 * lib/messaging/notify.ts — user-facing notification dispatcher.
 *
 * Wraps two side-effects into one atomic intent:
 *   1. Always write a Notification row (inapp = on by default;
 *      turning it off in Settings hides the row from the inbox UI
 *      but the row still exists, so re-enabling shows historical
 *      events).
 *   2. Conditionally send a transactional email if the recipient
 *      has `notifChannels.email` true AND a usable email address.
 *
 * Email failure is non-fatal — the inbox row still serves as the
 * authoritative event record. Caller logs the email leg error
 * (returned in the result) but doesn't roll back the row.
 *
 * Distinct from:
 *   - lib/notifications/lead-created.ts (M3 PM-alert; fixed-
 *     recipient ops alert, no Notification row)
 *   - lib/messaging/send.ts (M4-02 chat; lead-scoped Message
 *     rows, PR-B)
 *
 * Caller pattern (M5-03 mutations wire in M4-03 commit):
 *
 *   await notify({
 *     recipient: { id, email, locale, notifChannels },
 *     event: { name: "consult.status_changed",
 *              input: { leadCode, newStatus } },
 *     meta: { leadId },
 *   });
 *
 * DI variant `notifyUsing(deps, ...)` for tests — same convention
 * as lib/admin/lead-mutations.ts.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sendEmail, type EmailSendResult, type ResendLike } from "./email-client";
import { parseNotifChannels } from "./notif-channels";
import {
  buildTemplate,
  NOTIFY_KIND_BY_EVENT,
  type NotifyEvent,
  type NotifyLocale,
} from "./notify-templates";

export interface NotifyRecipient {
  id: string;
  email: string | null;
  locale: NotifyLocale;
  /** Raw Prisma.JsonValue from User.notifChannels; parsed here. */
  notifChannels: Prisma.JsonValue | null | undefined;
}

export interface NotifyParams {
  recipient: NotifyRecipient;
  event: NotifyEvent;
  /** Free-form Json stored alongside the row (e.g. `{ leadId }`).
   *  The inbox UI uses this to build deep-links. */
  meta?: Prisma.InputJsonValue;
}

export interface NotifyResult {
  notificationId: string;
  /**
   * - `sent`: email leg attempted and succeeded
   * - `skipped_pref`: recipient opted out of email
   * - `skipped_no_address`: recipient has no email on file
   * - `failed`: email leg attempted and failed (non-fatal;
   *   notification row still wrote)
   */
  email: "sent" | "skipped_pref" | "skipped_no_address" | "failed";
  emailDetail?: EmailSendResult;
}

export interface NotifyDeps {
  createNotification: (data: {
    userId: string;
    kind: string;
    title: Prisma.InputJsonValue;
    body: Prisma.InputJsonValue;
    meta?: Prisma.InputJsonValue;
  }) => Promise<{ id: string }>;
  sendEmail: (to: string, subject: string, text: string) => Promise<EmailSendResult>;
}

const productionDeps: NotifyDeps = {
  createNotification: async (data) =>
    prisma.notification.create({
      data: {
        userId: data.userId,
        kind: data.kind,
        title: data.title,
        body: data.body,
        meta: data.meta ?? Prisma.DbNull,
      },
      select: { id: true },
    }),
  sendEmail: (to, subject, text) => sendEmail({ to, subject, text }),
};

export async function notifyUsing(deps: NotifyDeps, params: NotifyParams): Promise<NotifyResult> {
  const tpl = buildTemplate(params.event);
  const kind = NOTIFY_KIND_BY_EVENT[params.event.name];

  // Inapp row first — authoritative event record. Failure here
  // bubbles (no notification AND no email = total loss).
  const row = await deps.createNotification({
    userId: params.recipient.id,
    kind,
    title: tpl.notification.title as unknown as Prisma.InputJsonValue,
    body: tpl.notification.body as unknown as Prisma.InputJsonValue,
    meta: params.meta,
  });

  const prefs = parseNotifChannels(params.recipient.notifChannels);
  if (!prefs.email) {
    return { notificationId: row.id, email: "skipped_pref" };
  }
  if (!params.recipient.email) {
    return { notificationId: row.id, email: "skipped_no_address" };
  }

  const { subject, text } = tpl.email(params.recipient.locale);
  const emailRes = await deps.sendEmail(params.recipient.email, subject, text);
  if (emailRes.ok) {
    return { notificationId: row.id, email: "sent", emailDetail: emailRes };
  }
  return { notificationId: row.id, email: "failed", emailDetail: emailRes };
}

/** Production wrapper — uses the singleton prisma + real Resend. */
export async function notify(params: NotifyParams): Promise<NotifyResult> {
  return notifyUsing(productionDeps, params);
}

/** Re-exports for routes that want to inspect the result shape. */
export type { NotifyEvent, NotifyLocale, ResendLike };
