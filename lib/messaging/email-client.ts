/*
 * lib/messaging/email-client.ts — single Resend wrapper.
 *
 * Three callers will use this:
 *   - lib/notifications/lead-created.ts (M3 PM-alert; refactored to
 *     come through here in a follow-up rather than instantiating
 *     Resend itself)
 *   - lib/messaging/notify.ts (M4-03 user-facing transactional)
 *   - lib/messaging/send.ts (M4-02 chat email mirror, PR-B)
 *
 * All three share:
 *   - lazy client init so test imports of pure formatters don't
 *     trip on a missing RESEND_API_KEY
 *   - env-var presence check returning a typed result instead of
 *     throwing (caller decides whether failure is fatal)
 *   - identical log shape so the M3 runbook patterns transfer
 *
 * `sendEmailUsing` is the pure-DI variant — tests inject a fake
 * Resend so behavioural assertions don't need network access.
 */

import { Resend } from "resend";

export interface EmailEnvelope {
  /** Already-resolved recipient (string, not array — one user at a time). */
  to: string;
  subject: string;
  /** Plain text. HTML rendering deferred to M7 polish; ops emails read
   *  better as wall-of-text and avoid recipient-client CSS surprises. */
  text: string;
}

export type EmailSendResult =
  | { ok: true; messageId: string }
  | { ok: false; code: "config_missing"; detail: string }
  | { ok: false; code: "send_failed"; detail: string };

export interface EmailClientConfig {
  apiKey: string;
  from: string;
}

export interface ResendLike {
  emails: {
    send: (input: { from: string; to: string; subject: string; text: string }) => Promise<{
      data: { id?: string } | null;
      error: { message: string } | null;
    }>;
  };
}

/** Accepts the global `process.env` shape OR a plain dictionary
 *  (tests pass `{ RESEND_API_KEY, RESEND_FROM }` without the
 *  full Node ProcessEnv surface). Vars are optional — the function
 *  returns `{ error }` if they're missing. */
export type EmailEnv = Partial<Record<string, string | undefined>>;

export function readEmailConfig(
  env: EmailEnv = process.env,
): EmailClientConfig | { error: string } {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  if (!apiKey || !from) {
    return { error: `resend env missing: apiKey=${!!apiKey} from=${!!from}` };
  }
  return { apiKey, from };
}

/**
 * DI variant. Tests pass a fake `client` so they don't need the
 * Resend SDK and the typed result codes can be asserted directly.
 */
export async function sendEmailUsing(
  client: ResendLike,
  from: string,
  envelope: EmailEnvelope,
): Promise<EmailSendResult> {
  try {
    const res = await client.emails.send({
      from,
      to: envelope.to,
      subject: envelope.subject,
      text: envelope.text,
    });
    if (res.error) {
      return { ok: false, code: "send_failed", detail: res.error.message };
    }
    return { ok: true, messageId: res.data?.id ?? "unknown" };
  } catch (e) {
    return {
      ok: false,
      code: "send_failed",
      detail: e instanceof Error ? e.message : "unknown",
    };
  }
}

/**
 * Production wrapper — env-var-driven, real Resend SDK. Returns a
 * typed result rather than throwing; callers (notify dispatcher,
 * chat fan-out) treat email failure as non-fatal and degrade to the
 * in-app surface.
 */
export async function sendEmail(envelope: EmailEnvelope): Promise<EmailSendResult> {
  const cfg = readEmailConfig();
  if ("error" in cfg) {
    return { ok: false, code: "config_missing", detail: cfg.error };
  }
  const client = new Resend(cfg.apiKey);
  return sendEmailUsing(client as unknown as ResendLike, cfg.from, envelope);
}
