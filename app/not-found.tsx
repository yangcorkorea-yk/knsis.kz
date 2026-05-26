/*
 * app/not-found.tsx — root 404 boundary.
 *
 * Reached when the [locale] segment can't match a known locale —
 * e.g. /foo/anything triggers `[locale]/layout.tsx`'s
 * `if (!isLocale(locale)) notFound()`. Next.js abandons the
 * locale layout (its <html>/<body> are NOT in the tree) and
 * renders this file under `app/layout.tsx`. Since the root
 * layout intentionally returns `{children}` only (no html/body —
 * the locale layout owns those so `<html lang>` matches the
 * active locale), THIS file must supply <html>/<body>.
 *
 * Copy is locale-agnostic English: by definition we got here
 * because the URL didn't carry a known locale, so we can't pick
 * one for the user. Middleware redirects `/` → /kz, so the home
 * link sends them to a localised page.
 *
 * See `docs/runbook/nextjs-not-found.md` for why we need this
 * file (Next 14 default not-found UI provides its own <html>;
 * combined with the [locale] layout's <html>, the browser DOM
 * rejects the second document-level element with
 * HierarchyRequestError, surfacing as React #418 / #423
 * hydration failures).
 */

import Link from "next/link";
import "./globals.css";

export default function NotFound() {
  return (
    <html lang="en">
      <body className="bg-warm font-sans text-ink antialiased">
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center md:max-w-3xl">
          <p className="text-5xl font-extrabold tracking-display text-ink">404</p>
          <p className="text-sm text-ink-body">This page could not be found.</p>
          <Link
            href="/"
            className="rounded-full border border-rose px-4 py-2 text-sm font-medium text-rose-deep transition-colors hover:bg-rose-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
          >
            Go home
          </Link>
        </main>
      </body>
    </html>
  );
}
