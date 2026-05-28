/*
 * lib/ratelimit/lead-limits.ts — POST /api/leads rate-limit
 * checks (M3-05).
 *
 * Two policies enforced before createLead runs:
 *   1. Per-user-per-day  — at most LEAD_PER_USER_PER_DAY (5)
 *      leads from the same guest cookie / user id in a rolling
 *      24h window.
 *   2. Per-phone-per-10m — at most LEAD_PER_PHONE_PER_WINDOW
 *      (1) lead with the same submitted phone within the last
 *      LEAD_PHONE_WINDOW_MS (10 minutes). Catches a spammer who
 *      cycles cookies but reuses the same phone.
 *
 * The WBS spec wording ("5 / IP / day") was relaxed to user-bound
 * for two reasons:
 *   - We don't store request IP on Lead (PII hygiene, EU posture).
 *   - User-bound is functionally similar for cookie-respecting
 *     clients and degrades gracefully — an attacker who clears
 *     cookies still hits the phone-per-10m bucket on legitimate
 *     leads.
 *
 * Pure helpers; the route composes them with Prisma. Vitest
 * uses an injected dep stub.
 */

export const LEAD_PER_USER_PER_DAY = 5;
export const LEAD_USER_WINDOW_MS = 24 * 60 * 60 * 1000;
export const LEAD_PER_PHONE_PER_WINDOW = 1;
export const LEAD_PHONE_WINDOW_MS = 10 * 60 * 1000;

export interface LeadLimitDeps {
  countLeadsForUser: (params: { userId: string; since: Date }) => Promise<number>;
  countLeadsForPhone: (params: { phone: string; since: Date }) => Promise<number>;
  /** Clock seam for vitest determinism. */
  now?: () => Date;
}

export type LimitDecision =
  | { ok: true }
  | { ok: false; code: "rate_user_day" | "rate_phone_window" };

export async function checkLeadRateLimits(
  input: { userId: string; phone: string },
  deps: LeadLimitDeps,
): Promise<LimitDecision> {
  const now = deps.now?.() ?? new Date();

  const userCount = await deps.countLeadsForUser({
    userId: input.userId,
    since: new Date(now.getTime() - LEAD_USER_WINDOW_MS),
  });
  if (userCount >= LEAD_PER_USER_PER_DAY) {
    return { ok: false, code: "rate_user_day" };
  }

  const phoneCount = await deps.countLeadsForPhone({
    phone: input.phone,
    since: new Date(now.getTime() - LEAD_PHONE_WINDOW_MS),
  });
  if (phoneCount >= LEAD_PER_PHONE_PER_WINDOW) {
    return { ok: false, code: "rate_phone_window" };
  }

  return { ok: true };
}
