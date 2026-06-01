/*
 * lib/messaging/notif-channels.ts — typed read/write of
 * `User.notifChannels` Json.
 *
 * The column is `Json` at the Prisma layer so adding `wa / tg /
 * sms` keys in M6 doesn't require a re-migration. The trade-off is
 * that Prisma types it as `Prisma.JsonValue` — we need a runtime
 * shape check before reading per-key booleans. This helper is the
 * one allowed surface for that check; downstream code (Settings,
 * chat fan-out, M4-03 email triggers) never touches the raw Json.
 *
 * Schema invariants enforced here:
 *   - The shape is a plain object (`null` / arrays / scalars → coerce
 *     to defaults).
 *   - Each key is one of `MVP_CHANNELS` (currently `inapp · email`).
 *   - Each value is boolean.
 *   - Missing keys default to `true` (opt-in baseline matching the
 *     migration default).
 *
 * Future expansion (`wa`, `tg`, `sms` in M6) just extends the
 * `MVP_CHANNELS` list in `send.ts`; this helper picks them up
 * automatically.
 */

import type { Prisma } from "@prisma/client";
import { MVP_CHANNELS, type MvpChannel } from "./send";

export type NotifChannelPrefs = Record<MvpChannel, boolean>;

const DEFAULTS: NotifChannelPrefs = MVP_CHANNELS.reduce(
  (acc, ch) => ({ ...acc, [ch]: true }),
  {} as NotifChannelPrefs,
);

/**
 * Coerce a Prisma Json value into a typed channel-pref map.
 * Returns `{ ...DEFAULTS, ...validatedKeysFromInput }` so unknown
 * payloads (DB drift, malformed manual edit) degrade safely to
 * "everything opted-in".
 */
export function parseNotifChannels(raw: Prisma.JsonValue | null | undefined): NotifChannelPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULTS };
  }
  const out: NotifChannelPrefs = { ...DEFAULTS };
  for (const ch of MVP_CHANNELS) {
    const v = (raw as Record<string, Prisma.JsonValue>)[ch];
    if (typeof v === "boolean") out[ch] = v;
  }
  return out;
}

/**
 * Serialise back to the Json shape Prisma writes. Discards unknown
 * keys silently so a future Settings page that's behind on a new
 * channel doesn't accidentally clobber data the server understands.
 */
export function serializeNotifChannels(prefs: NotifChannelPrefs): Prisma.InputJsonValue {
  const out: Record<string, boolean> = {};
  for (const ch of MVP_CHANNELS) out[ch] = prefs[ch];
  return out;
}

/**
 * Predicate the dispatcher calls before send. `notifChannels.email
 * === false` → silently skip the email mirror. Inapp is the
 * polling read path; turning it off DOESN'T suppress server-side
 * writes (the row still lands; the client just renders nothing
 * until the user re-enables).
 */
export function shouldDispatch(prefs: NotifChannelPrefs, channel: MvpChannel): boolean {
  return prefs[channel] !== false;
}

export const NOTIF_CHANNEL_DEFAULTS: Readonly<NotifChannelPrefs> = Object.freeze({ ...DEFAULTS });
