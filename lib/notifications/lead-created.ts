/*
 * lib/notifications/lead-created.ts — "new lead landed" PM
 * alert (M3-03).
 *
 * Per the M3 Option A decision (docs/decisions/lead-channel-strategy.md):
 * leads land in the DB → admin inbox surfaces them in M5 →
 * this module fires a Resend transactional email to the PM
 * so they don't have to poll the inbox.
 *
 * Distinct from `lib/messaging/send.ts`:
 *   - `send.ts` is the seam for outbound *customer-facing*
 *     messages (Lead-scoped, Channel-scoped, MVP-channel-
 *     guarded). M4-02 wires inapp, M4-04 wires email-to-customer.
 *   - This module is *internal ops alerting* — no Lead-scoped
 *     channel preference, no enum guard, addressed to a single
 *     env-configured PM mailbox.
 *
 * `formatLeadCreatedEmail` is pure (no Resend / Prisma imports)
 * so vitest pins the subject + body shape. `sendLeadCreatedEmail`
 * wraps it with the real Resend client + the env vars.
 *
 * Hard rule check: no monetary terms (the lead payload has no
 * such fields; the email body never quotes any either).
 */

import { Resend } from "resend";

export interface LeadCreatedInput {
  code: string;
  locale: "kz" | "ru" | "kr";
  /** Display phone (already E.164-normalised by the schema). */
  phone: string;
  /** Optional name; rendered as "(anonymous)" when absent. */
  name?: string | null;
  treatmentTitles: string[];
  regionLabels: string[];
  kind: ("korea" | "local")[];
  hasPhotos: boolean;
  message: string | null;
  consentMkt: boolean;
  /** Origin used for the admin URL. */
  appUrl: string;
}

export interface FormattedEmail {
  subject: string;
  text: string;
}

/**
 * Build the PM alert email. Plain text on purpose — Resend
 * handles HTML wrapping for marketing surfaces, but ops alerts
 * read better as wall-of-text and don't depend on the recipient's
 * email client rendering CSS.
 */
export function formatLeadCreatedEmail(input: LeadCreatedInput): FormattedEmail {
  const subject = `[knsis.kz] New lead ${input.code} (${input.locale.toUpperCase()})`;
  const name = input.name?.trim() || "(anonymous)";
  const adminUrl = `${input.appUrl.replace(/\/+$/, "")}/admin/${input.locale}/leads/${input.code}`;

  const lines = [
    `A new consult request landed.`,
    ``,
    `Code:        ${input.code}`,
    `Locale:      ${input.locale}`,
    `Phone:       ${input.phone}`,
    `Name:        ${name}`,
    `Treatments:  ${input.treatmentTitles.join(", ") || "—"}`,
    `Regions:     ${input.regionLabels.join(", ") || "—"}`,
    `Path:        ${input.kind.join(" + ") || "—"}`,
    `Photos:      ${input.hasPhotos ? "yes" : "no"}`,
    `Marketing:   ${input.consentMkt ? "opted in" : "—"}`,
    ``,
    `Message:`,
    input.message?.trim() ? input.message.trim() : "(none)",
    ``,
    `Open in admin: ${adminUrl}`,
  ];

  return { subject, text: lines.join("\n") };
}

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

/**
 * Real Resend send. Lazy-instantiates the client so test imports
 * of `formatLeadCreatedEmail` don't trip on a missing RESEND_API_KEY.
 *
 * Returns a typed result instead of throwing — the caller treats a
 * failed notification as non-fatal (the Lead row is already in the DB;
 * the PM can still find it in the admin inbox).
 */
export async function sendLeadCreatedEmail(input: LeadCreatedInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.RESEND_NOTIFY_TO;
  if (!apiKey || !from || !to) {
    return { ok: false, error: "resend env not configured" };
  }
  const { subject, text } = formatLeadCreatedEmail(input);
  try {
    const client = new Resend(apiKey);
    const res = await client.emails.send({ from, to, subject, text });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, messageId: res.data?.id ?? "unknown" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}
