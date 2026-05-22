/*
 * /[locale]/categories — layout.
 *
 * Owns the chrome (header + FilterBar). Lives in the layout slot
 * so the pill row stays mounted across navigations — when the user
 * taps a pill the URL changes, `loading.tsx` paints the grid
 * skeleton in the `{children}` slot, and the active pill on the
 * FilterBar is repainted immediately (useSearchParams reacts to
 * the new URL without unmounting).
 *
 * Page-level data fetching lives in `page.tsx`.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { FilterBar } from "@/components/discover/filter-bar";

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
      <FilterBar />
      {children}
    </main>
  );
}
