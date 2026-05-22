/*
 * lib/auth/ensure-guest-user.ts — lazy guest-user creator.
 *
 * Per the M1 decisions: middleware does NOT create User rows. The
 * row materialises on the first *meaningful* write (POST /api/leads
 * etc.), invoked by that route's handler. Page views and read-only
 * requests stay DB-free.
 *
 * The handler should call `ensureGuestUserFromRequest()` at the top
 * of its body, then proceed with the writeUserId returned. Bots are
 * detected by user-agent and short-circuited before any DB or cookie
 * work — caller decides whether to return 410 / accept silently.
 *
 * Idempotent across concurrent requests sharing a guestId thanks to
 * `User.guestId @unique` + Prisma upsert.
 */

import { type Locale, Role } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db/client";
import {
  GUEST_COOKIE_ATTRS,
  GUEST_COOKIE_NAME,
  newGuestId,
  signGuestCookie,
  verifyGuestCookie,
} from "./cookie";

// Regex pinned to the M1 spec wording. Narrow on purpose — a false
// negative (a sneaky UA slipping through) at worst leaks one stray
// guest row; a false positive would silently drop a legitimate write.
// Expand only with explicit sign-off.
const BOT_UA = /bot|crawl|spider/i;

export type EnsureResult =
  | { kind: "ok"; userId: string; guestId: string; cookieSet: boolean }
  | { kind: "bot" };

/** Inputs the pure helper needs. Kept dependency-free for testing. */
export interface EnsureDeps {
  cookieValue: string | undefined;
  setCookie: (value: string) => void;
  userAgent: string | undefined;
  /** Locale hint from the URL segment (`params.locale`); falls back to kz. */
  locale?: Locale;
  /** GUEST_COOKIE_SECRET. The helper throws via signGuestCookie if blank. */
  secret: string;
  upsertUser: (input: { guestId: string; locale: Locale }) => Promise<{ id: string }>;
}

/**
 * Pure helper — no Next/Prisma imports in the type, no env reads.
 * Used directly in tests; the route-handler wrapper composes it
 * with `next/headers` + `prisma`.
 */
export async function ensureGuestUser(deps: EnsureDeps): Promise<EnsureResult> {
  if (deps.userAgent && BOT_UA.test(deps.userAgent)) {
    return { kind: "bot" };
  }

  const verified = await verifyGuestCookie(deps.cookieValue, deps.secret);
  let guestId: string;
  let cookieSet = false;
  if (verified) {
    guestId = verified;
  } else {
    guestId = newGuestId();
    const signed = await signGuestCookie(guestId, deps.secret);
    deps.setCookie(signed);
    cookieSet = true;
  }

  const locale: Locale = deps.locale ?? "kz";
  const user = await deps.upsertUser({ guestId, locale });
  return { kind: "ok", userId: user.id, guestId, cookieSet };
}

/**
 * Route-handler wrapper. Reads cookies + UA from `next/headers`,
 * issues the cookie via `cookies().set(...)` when needed, and calls
 * a Prisma upsert keyed on `User.guestId`.
 *
 * Not yet called anywhere — the first caller is M3-03 (POST /api/leads).
 * Re-export shape is stable so M3 wires in without churn.
 */
export async function ensureGuestUserFromRequest(opts?: {
  locale?: Locale;
}): Promise<EnsureResult> {
  const cookieStore = cookies();
  const hdrs = headers();
  const secret = process.env.GUEST_COOKIE_SECRET ?? "";

  return ensureGuestUser({
    cookieValue: cookieStore.get(GUEST_COOKIE_NAME)?.value,
    setCookie: (value) => {
      cookieStore.set({ name: GUEST_COOKIE_NAME, value, ...GUEST_COOKIE_ATTRS });
    },
    userAgent: hdrs.get("user-agent") ?? undefined,
    locale: opts?.locale,
    secret,
    upsertUser: async ({ guestId, locale }) =>
      prisma.user.upsert({
        where: { guestId },
        create: { guestId, locale, role: Role.guest },
        update: {},
        select: { id: true },
      }),
  });
}
