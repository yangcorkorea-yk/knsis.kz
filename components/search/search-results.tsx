/*
 * components/search/search-results.tsx
 *
 * Renders the three result sections (Treatments / Clinics / Reviews)
 * with locale-resolved titles + highlighted query matches. Pure
 * server-rendered presentation; clicking a result navigates via
 * <Link> to the canonical detail / list page.
 *
 * Reviews don't have a detail route in MVP (M2-06 decision —
 * list-only), so their card is a non-link presentation block.
 */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";
import type { SearchOutput } from "@/lib/search/search";
import { HighlightedText } from "./highlighted-text";

interface Props {
  results: SearchOutput;
  query: string;
  locale: Locale;
  labels: {
    treatments: string;
    clinics: string;
    reviews: string;
    empty: string;
  };
}

export function SearchResults({ results, query, locale, labels }: Props) {
  if (results.totalCount === 0) {
    return <p className="px-4 text-sm text-ink-mute">{labels.empty}</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      {results.treatments.length > 0 && (
        <Section title={labels.treatments}>
          <ul className="flex flex-col gap-3 px-4">
            {results.treatments.map((tx) => (
              <li key={tx.id}>
                <Link
                  href={`/${locale}/treatments/${tx.slug}`}
                  className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
                >
                  <Card>
                    <CardContent className="space-y-1 pt-4">
                      <p className="break-keep text-sm font-semibold text-ink">
                        <HighlightedText text={tr(tx.title, locale)} query={query} />
                      </p>
                      <p className="line-clamp-2 text-xs text-ink-mute">
                        <HighlightedText text={tr(tx.summary, locale)} query={query} />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {results.clinics.length > 0 && (
        <Section title={labels.clinics}>
          <ul className="flex flex-col gap-3 px-4">
            {results.clinics.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/${locale}/clinics/${c.slug}`}
                  className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
                >
                  <Card>
                    <CardContent className="space-y-1 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="break-keep text-sm font-semibold text-ink">
                          <HighlightedText text={tr(c.name, locale)} query={query} />
                        </p>
                        <Badge tone={c.kind === "korea" ? "korea" : "lav"} size="sm">
                          {c.kind}
                        </Badge>
                      </div>
                      {c.city && (
                        <p className="text-xs text-ink-mute">
                          <HighlightedText text={tr(c.city, locale)} query={query} />
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {results.reviews.length > 0 && (
        <Section title={labels.reviews}>
          <ul className="flex flex-col gap-3 px-4">
            {results.reviews.map((r) => (
              <li key={r.id}>
                <Card>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-ink-mute">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-tint text-xs font-bold text-rose-deep">
                          {r.customerInitial}
                        </span>
                        <span className="font-semibold text-ink-2">{r.customerInitial}.</span>
                      </div>
                      <div
                        className="shrink-0 text-sm font-semibold text-rose-deep"
                        aria-label={`${r.rating}/5`}
                      >
                        <span aria-hidden="true">{"★".repeat(r.rating)}</span>
                        <span aria-hidden="true" className="text-line">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </div>
                    </div>
                    <p className="break-keep text-sm text-ink-2">
                      <HighlightedText text={tr(r.body, locale)} query={query} />
                    </p>
                    {(r.clinicName || r.treatmentTitle) && (
                      <p className="text-[11px] text-ink-mute">
                        {r.clinicName && (
                          <HighlightedText text={tr(r.clinicName, locale)} query={query} />
                        )}
                        {r.clinicName && r.treatmentTitle && <span className="mx-1">·</span>}
                        {r.treatmentTitle && (
                          <HighlightedText text={tr(r.treatmentTitle, locale)} query={query} />
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
        {title}
      </h2>
      {children}
    </section>
  );
}
