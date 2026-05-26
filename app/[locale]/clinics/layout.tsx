/*
 * /[locale]/clinics — layout. Owns the page header; the filter bar
 * lives inside <ClinicsIsland> in `page.tsx` so it can share state
 * with the grid.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

export default async function ClinicsLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("clinics");

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
