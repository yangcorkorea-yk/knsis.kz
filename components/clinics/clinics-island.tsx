"use client";

/*
 * components/clinics/clinics-island.tsx — single client-state holder
 * for the /[locale]/clinics surface. Mirrors the M2-02
 * CategoriesIsland: filter state lives here, URL stays in sync via
 * window.history.replaceState (no Next.js re-render → no refetch of
 * a force-dynamic page), popstate listener honours back/forward.
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
import { ClinicFilterBar } from "./clinic-filter-bar";
import type { ClientClinicCardData } from "./clinic-card";
import { ClinicsGrid } from "./clinics-grid";

interface Props {
  initialFilters: DiscoveryFilters;
  clinics: readonly ClientClinicCardData[];
  locale: Locale;
}

function syncUrl(filters: DiscoveryFilters) {
  if (typeof window === "undefined") return;
  const qs = filtersToSearchParams(filters).toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function ClinicsIsland({ initialFilters, clinics, locale }: Props) {
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
      <ClinicFilterBar filters={filters} onToggle={onToggle} onClear={onClear} />
      <ClinicsGrid filters={filters} clinics={clinics} locale={locale} />
    </>
  );
}
