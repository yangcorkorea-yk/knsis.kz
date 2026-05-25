"use client";

/*
 * components/discover/categories-island.tsx — the single client-state
 * holder for the discovery surface.
 *
 * Owns the filter state, wires FilterBar (input) ↔ CategoriesGrid
 * (output), and keeps the URL in sync via window.history.replaceState
 * so refresh + share still work without triggering a Next.js
 * re-render on every pill tap (router.replace would refetch the
 * force-dynamic page; we already have the full dataset in memory).
 *
 * Browser back / forward navigations are honoured via the popstate
 * listener — the URL is the master on those events.
 *
 * Why this exists: see docs/runbook/optimistic-feedback.md
 * §"When client-side filtering wins" — the previous server-side
 * filtering + useTransition + optimistic UI pattern still had a
 * dead-tap window when ICN→IAD→EU latency stacked, and rapid
 * multi-axis taps could surface stale intermediate renders. Holding
 * the truth client-side dissolves both classes of bug.
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
import { CategoriesGrid, type ClientClinic, type ClientTreatment } from "./categories-grid";
import { FilterBar } from "./filter-bar";

interface Props {
  initialFilters: DiscoveryFilters;
  treatments: readonly ClientTreatment[];
  clinics: readonly ClientClinic[];
  locale: Locale;
}

function syncUrl(filters: DiscoveryFilters) {
  if (typeof window === "undefined") return;
  const qs = filtersToSearchParams(filters).toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function CategoriesIsland({ initialFilters, treatments, clinics, locale }: Props) {
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
      <FilterBar filters={filters} onToggle={onToggle} onClear={onClear} />
      <CategoriesGrid filters={filters} treatments={treatments} clinics={clinics} locale={locale} />
    </>
  );
}
