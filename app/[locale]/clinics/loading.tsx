/*
 * /[locale]/clinics — Suspense fallback. Self-contained <main>
 * + header skeleton + six placeholder cards. Mirrors the list
 * page's chrome so the Suspense boundary doesn't cause a layout
 * shift when the data resolves. After the first paint, every
 * filter tap stays client-side and never re-triggers this
 * fallback (see runbook §"When client-side filtering wins").
 */

import { Card, CardContent } from "@/components/ui/card";

const PLACEHOLDER_COUNT = 6;

export default function ClinicsLoading() {
  return (
    <main
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24 md:max-w-3xl"
      aria-busy="true"
      aria-label="Loading"
    >
      <header className="px-4 pt-8">
        <span className="block h-7 w-2/5 animate-pulse rounded bg-line-soft" />
        <span className="mt-2 block h-4 w-3/5 animate-pulse rounded bg-line-soft" />
      </header>
      <ul className="flex flex-col gap-3 px-4">
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
    </main>
  );
}
