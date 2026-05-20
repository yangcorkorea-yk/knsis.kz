// lib/messaging/send.ts — single seam for outbound messages.
//
// The Prisma `Channel` enum keeps `wa`, `tg`, `sms` values for
// forward-compatibility with M-POST. The MVP must never write rows for
// those channels — adapters do not exist yet, and silently writing
// stale `queued` rows would mislead the manager workbench. This module
// rejects any non-MVP channel at call time so the constraint can't be
// bypassed by accident.
//
// Real network adapters (Resend, WhatsApp Cloud API, Telegram Bot API,
// Mobizon SMS) land in M4-04 (email) and M-POST (the rest).

import { Channel } from "@prisma/client";

export const MVP_CHANNELS = [Channel.inapp, Channel.email] as const;
export type MvpChannel = (typeof MVP_CHANNELS)[number];

export class UnsupportedChannelError extends Error {
  constructor(channel: Channel) {
    super(
      `Channel "${channel}" is reserved for M-POST. MVP may only send via ${MVP_CHANNELS.join(
        ", ",
      )}.`,
    );
    this.name = "UnsupportedChannelError";
  }
}

export function assertMvpChannel(channel: Channel): asserts channel is MvpChannel {
  if (!isMvpChannel(channel)) throw new UnsupportedChannelError(channel);
}

export function isMvpChannel(channel: Channel): channel is MvpChannel {
  return (MVP_CHANNELS as readonly Channel[]).includes(channel);
}

export interface SendInput {
  leadId: string;
  channel: Channel;
  body: string;
}

/**
 * Single entry point for outbound messages. Wired to per-channel
 * adapters as they're built:
 *   - M4-02 · inapp (Supabase Realtime broadcast + Message row)
 *   - M4-04 · email (Resend transactional)
 *   - M-POST · wa / tg / sms (will throw today)
 */
export async function send(input: SendInput): Promise<{ messageId: string }> {
  assertMvpChannel(input.channel);
  // Concrete channel handlers land in M4. For now the seam exists so
  // upstream callers can be wired with a typed boundary.
  throw new Error(`send(${input.channel}) not implemented yet — adapter arrives in M4-02 / M4-04.`);
}
