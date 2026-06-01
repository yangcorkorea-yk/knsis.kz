/*
 * lib/messaging/notif-channels.test.ts — cross-PR interface lock.
 *
 * This module is the contract between PR-A (Settings writes) and
 * PR-B (chat fan-out reads). Behavioural regression here = silent
 * misdelivery, so the tests cover every malformed-input shape that
 * could realistically arrive (DB drift, manual edits, M-POST channel
 * additions before code catches up).
 */

import { describe, expect, it } from "vitest";
import {
  NOTIF_CHANNEL_DEFAULTS,
  parseNotifChannels,
  serializeNotifChannels,
  shouldDispatch,
} from "./notif-channels";

describe("parseNotifChannels — coercion", () => {
  it("returns all-true defaults for null / undefined", () => {
    expect(parseNotifChannels(null)).toEqual({ inapp: true, email: true });
    expect(parseNotifChannels(undefined)).toEqual({ inapp: true, email: true });
  });

  it("returns defaults for non-object scalars (DB drift)", () => {
    expect(parseNotifChannels("garbage")).toEqual({ inapp: true, email: true });
    expect(parseNotifChannels(42)).toEqual({ inapp: true, email: true });
    expect(parseNotifChannels(false)).toEqual({ inapp: true, email: true });
  });

  it("returns defaults for arrays (malformed Json)", () => {
    expect(parseNotifChannels([true, false])).toEqual({ inapp: true, email: true });
  });

  it("respects explicit booleans for known keys", () => {
    expect(parseNotifChannels({ inapp: false, email: true })).toEqual({
      inapp: false,
      email: true,
    });
    expect(parseNotifChannels({ inapp: true, email: false })).toEqual({
      inapp: true,
      email: false,
    });
  });

  it("falls back to defaults for missing keys", () => {
    expect(parseNotifChannels({ inapp: false })).toEqual({ inapp: false, email: true });
    expect(parseNotifChannels({ email: false })).toEqual({ inapp: true, email: false });
    expect(parseNotifChannels({})).toEqual({ inapp: true, email: true });
  });

  it("silently drops non-boolean values for known keys", () => {
    expect(parseNotifChannels({ inapp: "no", email: 0 })).toEqual({ inapp: true, email: true });
  });

  it("silently drops unknown keys (forward-compat with M6 channels)", () => {
    // wa / tg / sms aren't in MVP_CHANNELS yet — parser should ignore
    // them so a partial-rollout DB doesn't blow up MVP code.
    const parsed = parseNotifChannels({ inapp: true, email: false, wa: true });
    expect(parsed).toEqual({ inapp: true, email: false });
    expect("wa" in parsed).toBe(false);
  });
});

describe("serializeNotifChannels", () => {
  it("round-trips a parsed value", () => {
    const original = { inapp: false, email: true } as const;
    const out = serializeNotifChannels({ ...original });
    expect(parseNotifChannels(out as never)).toEqual(original);
  });

  it("emits only known MVP keys (ignores extras)", () => {
    const messy = { inapp: true, email: false, ghost: true } as unknown as {
      inapp: boolean;
      email: boolean;
    };
    expect(serializeNotifChannels(messy)).toEqual({ inapp: true, email: false });
  });
});

describe("shouldDispatch", () => {
  it("opts in by default", () => {
    expect(shouldDispatch({ inapp: true, email: true }, "email")).toBe(true);
    expect(shouldDispatch({ inapp: true, email: true }, "inapp")).toBe(true);
  });

  it("opts out only on explicit false", () => {
    expect(shouldDispatch({ inapp: true, email: false }, "email")).toBe(false);
    expect(shouldDispatch({ inapp: false, email: true }, "inapp")).toBe(false);
  });
});

describe("NOTIF_CHANNEL_DEFAULTS", () => {
  it("matches the migration default literal", () => {
    expect(NOTIF_CHANNEL_DEFAULTS).toEqual({ inapp: true, email: true });
  });

  it("is frozen (callers can't mutate the shared baseline)", () => {
    expect(Object.isFrozen(NOTIF_CHANNEL_DEFAULTS)).toBe(true);
  });
});
