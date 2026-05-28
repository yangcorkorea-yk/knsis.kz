/*
 * lib/turnstile/verify.ts — Cloudflare Turnstile server-side
 * verify (M3-05).
 *
 * Two modes:
 *   - production: TURNSTILE_SECRET_KEY set → POST the token to
 *     https://challenges.cloudflare.com/turnstile/v0/siteverify
 *     and return ok iff Cloudflare says `success: true`.
 *   - dev: secret blank → skip verification, always ok. Lets
 *     local + preview-without-CF-keys work without false 4xx.
 *     The widget surface mirrors this: when the public site key
 *     is blank the form doesn't render the widget at all (see
 *     components/consult/turnstile-widget.tsx).
 *
 * Pure deps: caller injects the fetch function so vitest can
 * pin the request shape + the secret-blank branch.
 */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyDeps {
  /** Provided so vitest can stub without touching global fetch. */
  fetcher?: typeof fetch;
  /** Override env reads — vitest determinism. */
  secret?: string;
  /** Optional client IP forwarded to Cloudflare (better signal). */
  remoteIp?: string | null;
}

export type VerifyResult =
  | { ok: true; skipped: boolean }
  | { ok: false; code: "turnstile_invalid" | "turnstile_unreachable" };

export async function verifyTurnstileToken(
  token: string | null | undefined,
  deps: TurnstileVerifyDeps = {},
): Promise<VerifyResult> {
  const secret = deps.secret ?? process.env.TURNSTILE_SECRET_KEY ?? "";

  // Dev mode: no secret configured → skip verify.
  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, code: "turnstile_invalid" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (deps.remoteIp) body.set("remoteip", deps.remoteIp);

  const fetcher = deps.fetcher ?? fetch;
  let res: Response;
  try {
    res = await fetcher(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    return { ok: false, code: "turnstile_unreachable" };
  }

  if (!res.ok) {
    return { ok: false, code: "turnstile_unreachable" };
  }

  let data: { success?: boolean } = {};
  try {
    data = (await res.json()) as { success?: boolean };
  } catch {
    return { ok: false, code: "turnstile_unreachable" };
  }

  if (data.success !== true) {
    return { ok: false, code: "turnstile_invalid" };
  }
  return { ok: true, skipped: false };
}
