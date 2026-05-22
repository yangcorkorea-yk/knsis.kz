/*
 * /[locale]/categories — discovery grid (M2-02).
 *
 * Server component. Reads three independent filters from
 * searchParams (area / concern / language) via lib/discover/
 * filters.ts (strict parsing — unknown values dropped). For the
 * remaining clinics that match area + language, builds a count
 * per Treatment id; then loads Treatments (optionally filtered by
 * concern category) and renders the grid.
 *
 * Layout: 2 columns ≤ md, 3 columns ≥ md. Mobile-first, centred
 * column ≤ md breakpoint.
 *
 * Hard rules check:
 *   - All copy from messages/{kz,ru,kr}.json (`categories.*`)
 *   - Treatment.title resolved via lib/i18n/tr.ts (kz fallback)
 *   - No monetary fields, no medical-claim phrasing — the seed CSV
 *     already cleared these and Treatment rows only carry
 *     title/summary/etc.
 *   - No PII rendered (treatments + counts only)
 */

import type { TreatmentCategory } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/discover/filter-bar";
import { prisma } from "@/lib/db/client";
import { CITY_SLUG_MAP, parseFilters } from "@/lib/discover/filters";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("categories");

  const filters = parseFilters(searchParams);

  // Clinics that match the area + language constraints. We always
  // pull this set even when both are absent so the per-treatment
  // count reflects the visible clinic universe in M2-04/05 too.
  const clinics = await prisma.clinic.findMany({
    where: {
      deletedAt: null,
      verifyState: "verified",
      ...(filters.area
        ? { location: { path: ["city"], equals: CITY_SLUG_MAP[filters.area] } }
        : {}),
      ...(filters.language ? { interpreters: { has: filters.language } } : {}),
    },
    select: { id: true, treatmentIds: true },
  });

  const clinicCountByTreatment = new Map<string, number>();
  for (const c of clinics) {
    for (const tid of c.treatmentIds) {
      clinicCountByTreatment.set(tid, (clinicCountByTreatment.get(tid) ?? 0) + 1);
    }
  }

  const treatments = await prisma.treatment.findMany({
    where: {
      deletedAt: null,
      ...(filters.concern ? { category: filters.concern as TreatmentCategory } : {}),
      // When area / language are constrained, only show treatments
      // that have at least one matching clinic.
      ...(filters.area || filters.language
        ? { id: { in: Array.from(clinicCountByTreatment.keys()) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24 md:max-w-3xl">
      <header className="px-4 pt-8">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-ink-body">{t("subtitle")}</p>
      </header>

      <FilterBar />

      {treatments.length === 0 ? (
        <p className="px-4 text-sm text-ink-mute">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3">
          {treatments.map((tx) => {
            const count = clinicCountByTreatment.get(tx.id) ?? 0;
            return (
              <li key={tx.id}>
                <Card className="h-full">
                  <CardContent className="space-y-2 pt-4">
                    <Badge tone="lav" size="sm">
                      {t(`filter.concern.${tx.category}`)}
                    </Badge>
                    <h2 className="line-clamp-2 break-keep text-sm font-semibold text-ink">
                      {tr(tx.title, activeLocale)}
                    </h2>
                    <p className="line-clamp-2 text-xs text-ink-mute">
                      {tr(tx.summary, activeLocale)}
                    </p>
                    <p className="pt-1 text-[11px] text-ink-mute">
                      {t("card.clinic_count", { count })}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
