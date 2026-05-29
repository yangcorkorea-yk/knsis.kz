import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/config";

/*
 * Middleware composes:
 *   1. next-intl locale routing (/, /kz, /ru, /kr)
 *   2. baseline security headers applied to every response
 *
 * Zero DB / Prisma imports here — guest session rows are written
 * lazily by M1-02's ensureGuestUser() on the first meaningful POST,
 * not on every page view.
 *
 * /admin/* is excluded from the locale matcher — the admin tree is
 * a parallel root with its own /admin/[locale] segment (M5-01) and
 * must not be rewritten through next-intl's marketing-locale
 * resolver, which would turn /admin/kz/sign-in into
 * /kz/admin/kz/sign-in → 404.
 */

const intlMiddleware = createMiddleware({
  locales: [...LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

// Security headers — defensive minimum. CSP is intentionally NOT set
// here yet; it lands once the M2 catalog pages know which inline
// styles/scripts they need (workbox SW + next-intl runtime).
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
