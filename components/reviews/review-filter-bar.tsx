"use client";

/*
 * components/reviews/review-filter-bar.tsx — three filter axes
 * (Area / Treatment / Clinic) for the M2-06 reviews feed.
 * Stateless.
 *
 * Treatment + Clinic options are data-driven by the visible review
 * set — the slug+title list comes pre-built from the page server
 * fetch (no pill for an option that filters to zero reviews).
 *
 * Each axis delegates to the shared <FilterAxis> primitive, which
 * auto-flips to a native dropdown when the option count exceeds
 * the M2-polish threshold (PILL_THRESHOLD = 7). Today's mock
 * dataset stays under the threshold; M5 admin growth (real
 * clinics + treatments) trips the dropdown branch automatically.
 */

import { useTranslations } from "next-intl";
import { FilterAxis } from "@/components/discover/filter-axis";
import { CITY_SLUGS, type DiscoveryFilters, type FilterKey } from "@/lib/discover/filters";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";

export interface FilterOption {
  slug: string;
  title: TrilingualText;
}

interface Props {
  filters: DiscoveryFilters;
  treatmentOptions: readonly FilterOption[];
  clinicOptions: readonly FilterOption[];
  locale: Locale;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: (key: FilterKey) => void;
}

export function ReviewFilterBar({
  filters,
  treatmentOptions,
  clinicOptions,
  locale,
  onToggle,
  onClear,
}: Props) {
  const t = useTranslations("reviews.filter");
  return (
    <div className="space-y-3" role="group" aria-label={t("group_label")}>
      <FilterAxis
        axisId="reviews-area"
        groupLabel={t("area.label")}
        allLabel={t("area.all")}
        active={filters.area ?? null}
        options={CITY_SLUGS.map((v) => ({ value: v, label: t(`area.${v}`) }))}
        onSelect={(v) => onToggle("area", v)}
        onClear={() => onClear("area")}
      />
      <FilterAxis
        axisId="reviews-treatment"
        groupLabel={t("treatment.label")}
        allLabel={t("treatment.all")}
        active={filters.treatment ?? null}
        options={treatmentOptions.map((o) => ({ value: o.slug, label: tr(o.title, locale) }))}
        onSelect={(v) => onToggle("treatment", v)}
        onClear={() => onClear("treatment")}
      />
      <FilterAxis
        axisId="reviews-clinic"
        groupLabel={t("clinic.label")}
        allLabel={t("clinic.all")}
        active={filters.clinic ?? null}
        options={clinicOptions.map((o) => ({ value: o.slug, label: tr(o.title, locale) }))}
        onSelect={(v) => onToggle("clinic", v)}
        onClear={() => onClear("clinic")}
      />
    </div>
  );
}
