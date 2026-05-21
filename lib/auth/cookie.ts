/*
 * lib/auth/cookie.ts — signed guest-session cookie primitives.
 *
 * The cookie value is `<guestId>.<sigBase64Url>` where:
 *   - guestId  : UUID v4 generated server-side
 *   - sig      : HMAC-SHA256(secret, guestId) over the same UTF-8 bytes
 *
 * The signature lets the server detect tampering without storing a
 * per-session record before any DB activity has happened (M1-01 has
 * zero DB writes — the User row only lands when the M1-02 lazy
 * creator fires on a meaningful action).
 *
 * Web Crypto API only — no `node:crypto`. Works on both Node and
 * Edge runtimes, which lets the same helpers run in route handlers,
 * server components, and (later) middleware if needed.
 */

export const GUEST_COOKIE_NAME = "knsis_guest";

/** Attributes applied when issuing the cookie (M1-02 callsites). */
export const GUEST_COOKIE_ATTRS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
} as const;

/** Generate a fresh opaque guest id (UUID v4). */
export function newGuestId(): string {
  return crypto.randomUUID();
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Sign a guest id into the cookie wire format. */
export async function signGuestCookie(guestId: string, secret: string): Promise<string> {
  if (!secret) throw new Error("GUEST_COOKIE_SECRET is not set");
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(guestId));
  return `${guestId}.${toBase64Url(sig)}`;
}

/**
 * Verify a cookie value. Returns the guestId on success, `null` on any
 * failure (missing, malformed, tampered, wrong secret). Never throws
 * for caller-supplied input — callers can treat null as "no session".
 */
export async function verifyGuestCookie(
  value: string | undefined,
  secret: string,
): Promise<string | null> {
  if (!secret || !value) return null;
  const dot = value.indexOf(".");
  if (dot <= 0 || dot === value.length - 1) return null;
  const guestId = value.slice(0, dot);
  const sigB64 = value.slice(dot + 1);

  // Cheap shape check — guestId must look like a UUID. Cuts off
  // garbage early without burning a HMAC.
  if (!/^[0-9a-f-]{36}$/i.test(guestId)) return null;

  let sigBytes: Uint8Array;
  try {
    sigBytes = fromBase64Url(sigB64);
  } catch {
    return null;
  }

  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(guestId));
  return ok ? guestId : null;
}
