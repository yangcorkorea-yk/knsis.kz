"use client";

/*
 * lib/discover/use-filterable-list.ts — memoised in-memory list filter.
 *
 * The discovery surface fetches its full dataset once on first load
 * (force-dynamic server component) and then runs all filter / count
 * math client-side. This hook is the primitive used by callers — it
 * recomputes only when `items`, `filter`, or `predicate` change by
 * reference.
 *
 * The predicate is expected to be referentially stable (declare at
 * module scope, or wrap with useCallback). Otherwise the memo
 * invalidates every render and we lose the cache.
 *
 * Reused by:
 *   - components/discover/categories-grid.tsx (M2-02)
 *   - components/clinics/clinics-list.tsx     (M2-04, planned)
 *   - components/search/search-results.tsx    (M2-08, planned)
 *
 * See docs/runbook/optimistic-feedback.md §"When client-side
 * filtering wins" for the architectural reasoning.
 */

import { useMemo } from "react";

export function useFilterableList<T, F>(
  items: readonly T[],
  filter: F,
  predicate: (item: T, filter: F) => boolean,
): T[] {
  return useMemo(() => items.filter((item) => predicate(item, filter)), [items, filter, predicate]);
}
