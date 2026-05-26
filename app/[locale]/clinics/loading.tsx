/*
 * /[locale]/clinics — Suspense fallback. Six skeleton cards mirror
 * the MVP-seed clinic count + give the layout something to render
 * while the initial server fetch resolves. After the first paint
 * all filter taps stay client-side and never re-trigger this
 * skeleton (see runbook).
 */

import { Card, CardContent } from "@/components/ui/card";

const PLACEHOLDER_COUNT = 6;

export default function ClinicsLoading() {
  return (
    <ul className="flex flex-col gap-3 px-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
        <li key={i}>
          <Card>
            <CardContent className="space-y-2 pt-4">
              <span className="block h-4 w-3/5 animate-pulse rounded bg-line-soft" />
              <span className="block h-3 w-1/3 animate-pulse rounded bg-line-soft" />
              <span className="block h-3 w-1/2 animate-pulse rounded bg-line-soft" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
