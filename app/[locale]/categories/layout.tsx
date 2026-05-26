/*
 * /[locale]/categories — layout.
 *
 * Owns the page header. FilterBar moved into <CategoriesIsland> as
 * part of the client-side filtering refactor — it has to share state
 * with the grid, and the island is the only place that state lives.
 *
 * Page-level data fetching lives in `page.tsx`.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

export default async function CategoriesLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("categories");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24 md:max-w-3xl">
      <header className="px-4 pt-8">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-ink-body">{t("subtitle")}</p>
      </header>
      {children}
    </main>
  );
}
