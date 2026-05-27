/*
 * /[locale]/search — unified search results (M2-08).
 *
 * Server component. Bulk-fetches all searchable items
 * (treatments + verified clinics + published reviews) and runs
 * the substring matcher in-process. For MVP traffic (≤ 30
 * treatments, < 200 clinics, < 50 reviews) the bulk-fetch is
 * cheaper than a Postgres FTS round-trip and sidesteps the
 * trilingual + Cyrillic + Hangul + Latin tokenisation problem
 * entirely. Post-MVP: swap `lib/search/search.ts` for a Postgres
 * FTS-backed implementation when corpus growth requires it.
 *
 * Disclaimer placement: HEADER (between page title and results).
 * PM decision per M2-08 brief — search returns mixed content
 * types (treatment facts + clinic facts + subjective review
 * snippets), so the user sees the medical notice BEFORE reading
 * any result. Search-specific copy under `search.disclaimer.*`.
 *
 * Trending = top 5 treatments by createdAt desc (server-rendered).
 * Recent searches = sessionStorage, client-side island below
 * trending. Recent list populates on the results page via the
 * <RecentSearchesTracker> on each successful query.
 *
 * Hard rules check:
 *   - All static copy from messages/{kz,ru,kr}.json (`search.*`)
 *   - Dynamic content via tr.ts (M2-09 + M2-06 trilingual seeds)
 *   - No monetary fields, no medical-claim phrasing
 *   - No PII (review customer name masked to first char only)
 *   - Disclaimer present at the top of the results
 *   - Query echo + body text rendered via React text nodes only
 *     (HighlightedText) — no dangerouslySetInnerHTML on user input
 */

import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RecentSearchesList, RecentSearchesTracker } from "@/components/search/recent-searches";
import { SearchResults } from "@/components/search/search-results";
import { MedicalDisclaimer } from "@/components/treatments/medical-disclaimer";
import { Input } from "@/components/ui/input";
import { CTA } from "@/components/ui/cta";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";
import {
  search,
  type SearchableClinic,
  type SearchableReview,
  type SearchableTreatment,
} from "@/lib/search/search";

export const dynamic = "force-dynamic";

const TRENDING_LIMIT = 5;

export default async function SearchPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("search");
  const query = pickQuery(searchParams.q);

  const [treatments, clinics, reviews] = await Promise.all([
    prisma.treatment.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, title: true, summary: true, category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clinic.findMany({
      where: { deletedAt: null, verifyState: "verified" },
      select: { id: true, slug: true, name: true, kind: true, location: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { state: "published" },
      select: {
        id: true,
        code: true,
        body: true,
        rating: true,
        user: { select: { name: true } },
        clinic: { select: { slug: true, name: true } },
        treatment: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const searchableTreatments: SearchableTreatment[] = treatments.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title as TrilingualText,
    summary: t.summary as TrilingualText,
    category: t.category,
  }));
  const searchableClinics: SearchableClinic[] = clinics.map((c) => {
    const loc = c.location as { cityI18n?: unknown } | null;
    return {
      id: c.id,
      slug: c.slug,
      name: c.name as TrilingualText,
      kind: c.kind,
      city: (loc?.cityI18n as TrilingualText) ?? null,
    };
  });
  const searchableReviews: SearchableReview[] = reviews.map((r) => ({
    id: r.id,
    code: r.code,
    body: r.body as TrilingualText,
    rating: r.rating,
    customerInitial: firstChar(r.user?.name ?? "?"),
    clinicSlug: r.clinic?.slug ?? null,
    clinicName: (r.clinic?.name as TrilingualText) ?? null,
    treatmentSlug: r.treatment?.slug ?? null,
    treatmentTitle: (r.treatment?.title as TrilingualText) ?? null,
  }));

  const results = search(query, {
    treatments: searchableTreatments,
    clinics: searchableClinics,
    reviews: searchableReviews,
  });

  const trending = searchableTreatments.slice(0, TRENDING_LIMIT);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24 md:max-w-3xl">
      <header className="px-4 pt-8">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <form action={`/${activeLocale}/search`} method="get" className="mt-3 flex gap-2">
          <label htmlFor="search-q" className="sr-only">
            {t("placeholder")}
          </label>
          <Input
            id="search-q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={t("placeholder")}
            autoComplete="off"
          />
          <CTA type="submit" size="md" fullWidth={false} variant="ink">
            {t("submit")}
          </CTA>
        </form>
        {query.length > 0 && (
          <p className="mt-3 text-xs text-ink-mute">
            {t("results_count", { count: results.totalCount, query })}
          </p>
        )}
      </header>

      <MedicalDisclaimer body={t("disclaimer.body")} ariaLabel={t("disclaimer.aria_label")} />

      {query.length === 0 ? (
        <>
          {trending.length > 0 && (
            <section className="px-4">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
                {t("trending_label")}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {trending.map((tx) => (
                  <li key={tx.id}>
                    <Link
                      href={`/${activeLocale}/search?q=${encodeURIComponent(tr(tx.title, activeLocale))}`}
                      className="inline-flex items-center rounded-full border border-line-soft bg-paper px-3 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-ground hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
                    >
                      {tr(tx.title, activeLocale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <RecentSearchesList
            locale={activeLocale}
            label={t("recent_label")}
            clearLabel={t("recent_clear")}
          />
        </>
      ) : (
        <>
          <RecentSearchesTracker query={query} />
          <SearchResults
            results={results}
            query={query}
            locale={activeLocale}
            labels={{
              treatments: t("section.treatments"),
              clinics: t("section.clinics"),
              reviews: t("section.reviews"),
              empty: t("empty_results"),
            }}
          />
        </>
      )}
    </main>
  );
}

function pickQuery(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim();
  return "";
}

function firstChar(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? Array.from(trimmed)[0]! : "?";
}
