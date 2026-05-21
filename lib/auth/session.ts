/*
 * lib/auth/session.ts — server-side guest session reader.
 *
 * Pure read-only: looks at the signed cookie, verifies the HMAC, and
 * returns the guestId. Never writes a cookie, never touches the DB.
 * The M1-02 lazy-create utility will compose this with a Prisma
 * upsert and a Set-Cookie when a meaningful action fires.
 */

import { cookies } from "next/headers";
import { GUEST_COOKIE_NAME, verifyGuestCookie } from "./cookie";

/**
 * Read the current request's guest cookie and return the guestId if
 * present and signature-valid. Returns null if there's no cookie,
 * if the secret isn't configured, or if the cookie is tampered with.
 */
export async function readGuestSession(): Promise<string | null> {
  const secret = process.env.GUEST_COOKIE_SECRET;
  if (!secret) return null;
  const c = cookies().get(GUEST_COOKIE_NAME);
  if (!c?.value) return null;
  return verifyGuestCookie(c.value, secret);
}
