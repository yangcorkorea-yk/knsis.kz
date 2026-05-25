/*
 * /[locale]/categories — Suspense fallback.
 *
 * Replaces the page slot in `layout.tsx` while the new filter
 * combination is being resolved (force-dynamic + 2 Prisma queries
 * = 500ms – 1.5s wall clock). The chrome (header + FilterBar) stays
 * mounted in the layout above so the user sees their new pill
 * highlighted immediately while the grid morphs.
 *
 * Eight placeholder cards is enough to fill the viewport above the
 * fold at the 2-col / 3-col responsive break.
 */

import { Card, CardContent } from "@/components/ui/card";

const PLACEHOLDER_COUNT = 8;

export default function CategoriesLoading() {
  return (
    <ul
      className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
        <li key={i}>
          <Card className="h-full">
            <CardContent className="space-y-2 pt-4">
              <span className="block h-4 w-16 animate-pulse rounded-full bg-line-soft" />
              <span className="block h-4 w-3/4 animate-pulse rounded bg-line-soft" />
              <span className="block h-3 w-full animate-pulse rounded bg-line-soft" />
              <span className="block h-3 w-2/3 animate-pulse rounded bg-line-soft" />
              <span className="mt-1 block h-3 w-1/3 animate-pulse rounded bg-line-soft" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
