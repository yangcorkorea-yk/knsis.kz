"use client";

/*
 * components/discover/categories-grid.tsx — client-side filtered grid.
 *
 * Owns the in-memory filter math: receives the full discovery dataset
 * from the server once and recomputes the visible treatments + per-card
 * clinic counts whenever <CategoriesIsland>'s filters change.
 *
 * Mirror of the old server-side query plan in page.tsx:
 *   1. Apply area + language to the clinic set → filteredClinics.
 *   2. Aggregate clinic counts per Treatment.id from filteredClinics.
 *   3. Apply concern to treatments → concernFilteredTreatments.
 *   4. If area or language is set, drop treatments whose count is 0
 *      (matches the old `id: { in: ... }` predicate).
 *
 * No PII rendered. No monetary fields. Disclaimer copy lives on the
 * Treatment detail page (M2-03), not on the index card.
 */

import type { TreatmentCategory } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type DiscoveryFilters, matchClinic, matchTreatment } from "@/lib/discover/filters";
import { useFilterableList } from "@/lib/discover/use-filterable-list";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";

export interface ClientClinic {
  id: string;
  treatmentIds: string[];
  city: string;
  interpreters: string[];
  // Required by `matchClinic` since M2-04 added the kind facet to
  // the shared filter shape. The categories grid never filters on
  // kind itself, but `matchClinic` ignores `filters.kind` when it's
  // absent, so the value is just along for the ride here.
  kind: "korea" | "local";
}

export interface ClientTreatment {
  id: string;
  title: { kz?: string | null; ru?: string | null; kr?: string | null };
  summary: { kz?: string | null; ru?: string | null; kr?: string | null };
  category: TreatmentCategory;
}

interface Props {
  filters: DiscoveryFilters;
  treatments: readonly ClientTreatment[];
  clinics: readonly ClientClinic[];
  locale: Locale;
}

export function CategoriesGrid({ filters, treatments, clinics, locale }: Props) {
  const t = useTranslations("categories");

  const filteredClinics = useFilterableList(clinics, filters, matchClinic);
  const concernFiltered = useFilterableList(treatments, filters, matchTreatment);

  const clinicCountByTreatment = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of filteredClinics) {
      for (const tid of c.treatmentIds) {
        m.set(tid, (m.get(tid) ?? 0) + 1);
      }
    }
    return m;
  }, [filteredClinics]);

  const visible = useMemo(() => {
    if (!filters.area && !filters.language) return concernFiltered;
    return concernFiltered.filter((tx) => (clinicCountByTreatment.get(tx.id) ?? 0) > 0);
  }, [concernFiltered, filters.area, filters.language, clinicCountByTreatment]);

  if (visible.length === 0) {
    return <p className="px-4 text-sm text-ink-mute">{t("empty")}</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3">
      {visible.map((tx) => {
        const count = clinicCountByTreatment.get(tx.id) ?? 0;
        return (
          <li key={tx.id}>
            <Card className="h-full">
              <CardContent className="space-y-2 pt-4">
                <Badge tone="lav" size="sm">
                  {t(`filter.concern.${tx.category}`)}
                </Badge>
                <h2 className="line-clamp-2 break-keep text-sm font-semibold text-ink">
                  {tr(tx.title, locale)}
                </h2>
                <p className="line-clamp-2 text-xs text-ink-mute">{tr(tx.summary, locale)}</p>
                <p className="pt-1 text-[11px] text-ink-mute">
                  {t("card.clinic_count", { count })}
                </p>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
