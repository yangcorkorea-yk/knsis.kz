"use client";

/*
 * components/reviews/reviews-island.tsx — single client-state holder
 * for the /[locale]/reviews surface. Mirrors M2-02 CategoriesIsland
 * and M2-04 ClinicsIsland 1:1: filter state lives here, URL syncs
 * via window.history.replaceState (no Next.js re-render →
 * no refetch of a force-dynamic page), popstate listener honours
 * browser back / forward.
 *
 * See docs/runbook/optimistic-feedback.md §"When client-side
 * filtering wins" for the architectural rationale.
 */

import { useCallback, useEffect, useState } from "react";
import {
  applyClear,
  applyToggle,
  type DiscoveryFilters,
  type FilterKey,
  filtersToSearchParams,
  parseFilters,
} from "@/lib/discover/filters";
import type { Locale } from "@/lib/i18n/config";
import type { ClientReviewData } from "./review-card";
import { ReviewFilterBar, type FilterOption } from "./review-filter-bar";
import { ReviewsGrid } from "./reviews-grid";

interface Props {
  initialFilters: DiscoveryFilters;
  reviews: readonly ClientReviewData[];
  treatmentOptions: readonly FilterOption[];
  clinicOptions: readonly FilterOption[];
  locale: Locale;
}

function syncUrl(filters: DiscoveryFilters) {
  if (typeof window === "undefined") return;
  const qs = filtersToSearchParams(filters).toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function ReviewsIsland({
  initialFilters,
  reviews,
  treatmentOptions,
  clinicOptions,
  locale,
}: Props) {
  const [filters, setFilters] = useState<DiscoveryFilters>(initialFilters);

  useEffect(() => {
    function onPop() {
      const params = Object.fromEntries(new URLSearchParams(window.location.search));
      setFilters(parseFilters(params));
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const onToggle = useCallback((key: FilterKey, value: string) => {
    setFilters((prev) => {
      const next = applyToggle(prev, key, value);
      syncUrl(next);
      return next;
    });
  }, []);

  const onClear = useCallback((key: FilterKey) => {
    setFilters((prev) => {
      const next = applyClear(prev, key);
      syncUrl(next);
      return next;
    });
  }, []);

  return (
    <>
      <ReviewFilterBar
        filters={filters}
        treatmentOptions={treatmentOptions}
        clinicOptions={clinicOptions}
        locale={locale}
        onToggle={onToggle}
        onClear={onClear}
      />
      <ReviewsGrid filters={filters} reviews={reviews} locale={locale} />
    </>
  );
}
