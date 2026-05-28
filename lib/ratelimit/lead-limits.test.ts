import { describe, expect, it, vi } from "vitest";
import {
  checkLeadRateLimits,
  LEAD_PER_PHONE_PER_WINDOW,
  LEAD_PER_USER_PER_DAY,
  type LeadLimitDeps,
} from "./lead-limits";

const FIXED_NOW = new Date("2026-05-28T12:00:00Z");

function makeDeps(
  overrides: Partial<LeadLimitDeps> = {},
  userCount = 0,
  phoneCount = 0,
): LeadLimitDeps {
  return {
    countLeadsForUser: vi.fn(async () => userCount),
    countLeadsForPhone: vi.fn(async () => phoneCount),
    now: () => FIXED_NOW,
    ...overrides,
  };
}

describe("checkLeadRateLimits", () => {
  it("ok when both counts are zero", async () => {
    const r = await checkLeadRateLimits(
      { userId: "u1", phone: "+77012345678" },
      makeDeps({}, 0, 0),
    );
    expect(r).toEqual({ ok: true });
  });

  it("rejects rate_user_day at the LEAD_PER_USER_PER_DAY boundary", async () => {
    const r = await checkLeadRateLimits(
      { userId: "u1", phone: "+77012345678" },
      makeDeps({}, LEAD_PER_USER_PER_DAY, 0),
    );
    expect(r).toEqual({ ok: false, code: "rate_user_day" });
  });

  it("ok when user count is one below the cap", async () => {
    const r = await checkLeadRateLimits(
      { userId: "u1", phone: "+77012345678" },
      makeDeps({}, LEAD_PER_USER_PER_DAY - 1, 0),
    );
    expect(r.ok).toBe(true);
  });

  it("rejects rate_phone_window when phone count >= LEAD_PER_PHONE_PER_WINDOW", async () => {
    const r = await checkLeadRateLimits(
      { userId: "u1", phone: "+77012345678" },
      makeDeps({}, 0, LEAD_PER_PHONE_PER_WINDOW),
    );
    expect(r).toEqual({ ok: false, code: "rate_phone_window" });
  });

  it("user limit takes precedence over phone limit on a double hit", async () => {
    const r = await checkLeadRateLimits(
      { userId: "u1", phone: "+77012345678" },
      makeDeps({}, LEAD_PER_USER_PER_DAY, LEAD_PER_PHONE_PER_WINDOW),
    );
    expect(r).toEqual({ ok: false, code: "rate_user_day" });
  });

  it("passes the correct `since` windows to the dep callbacks", async () => {
    let userSince: Date | undefined;
    let phoneSince: Date | undefined;
    const countLeadsForUser: LeadLimitDeps["countLeadsForUser"] = async (p) => {
      userSince = p.since;
      return 0;
    };
    const countLeadsForPhone: LeadLimitDeps["countLeadsForPhone"] = async (p) => {
      phoneSince = p.since;
      return 0;
    };
    await checkLeadRateLimits(
      { userId: "u1", phone: "+77012345678" },
      makeDeps({ countLeadsForUser, countLeadsForPhone }),
    );
    // user window = 24h
    expect(FIXED_NOW.getTime() - userSince!.getTime()).toBe(24 * 60 * 60 * 1000);
    // phone window = 10 min
    expect(FIXED_NOW.getTime() - phoneSince!.getTime()).toBe(10 * 60 * 1000);
  });
});
