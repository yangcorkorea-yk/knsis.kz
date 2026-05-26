/*
 * /[locale]/not-found.tsx — 404 boundary inside the locale layout.
 *
 * This file MUST NOT supply <html> / <body>. The [locale] layout
 * already wraps everything in <html lang={htmlLang(locale)}><body>,
 * and rendering a second <html> here is exactly the hydration
 * trap captured in `docs/runbook/nextjs-not-found.md`:
 *
 *   HierarchyRequestError: Failed to execute 'appendChild' on
 *   'Node': Only one element on document allowed.
 *
 * Without this file, Next.js 14's built-in default not-found UI
 * provides its own <html> + body, gets wrapped by the [locale]
 * layout's <html><body>, and the browser DOM rejects the second
 * document-level element.
 *
 * The component is locale-aware via getTranslations — the
 * [locale]/layout.tsx already called setRequestLocale before
 * Next chose the not-found boundary, so the next-intl request
 * context is alive.
 */

import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notfound");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 bg-warm px-4 text-center md:max-w-3xl">
      <p className="text-5xl font-extrabold tracking-display text-ink">404</p>
      <p className="text-sm text-ink-body">{t("body")}</p>
      <Link
        href="/"
        className="rounded-full border border-rose px-4 py-2 text-sm font-medium text-rose-deep transition-colors hover:bg-rose-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
      >
        {t("home_link")}
      </Link>
    </main>
  );
}
