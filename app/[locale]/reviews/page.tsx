/*
 * /[locale]/reviews — read-only reviews feed (M2-06).
 *
 * Server component. Bulk-fetches published reviews + the clinics
 * and treatments they reference (denormalised so the client
 * filter can match by slug without a second round-trip). Same
 * shape as M2-04 clinics list: server bulk fetch on cold load,
 * client island runs all filter math in-memory.
 *
 * Per spec: list-only surface (no detail page). Reviews are
 * read-only in MVP; moderation queue lives in M5.
 *
 * Disclaimer placement: HEADER (between page title and filter
 * bar). PM decision — reviews are subjective experience
 * (different intent than treatment / clinic detail pages where
 * disclaimer sits between sections), so users see the medical
 * notice BEFORE reading any user copy. CLAUDE.md §2 spirit
 * applied beyond the literal "treatment + clinic" wording.
 *
 * Hard rules check:
 *   - All static copy from messages/{kz,ru,kr}.json (`reviews.*`)
 *   - Review.body via lib/i18n/tr.ts (M2-06 trilingual seed)
 *   - No monetary fields, no medical-claim phrasing
 *   - No PII: customer_name masked to first character only;
 *     full name never serialised to the client
 *   - Disclaimer present at the top of the feed
 */

import { setRequestLocale, getTranslations } from "next-intl/server";
import { type ClientReviewData } from "@/components/reviews/review-card";
import { type FilterOption } from "@/components/reviews/review-filter-bar";
import { ReviewsIsland } from "@/components/reviews/reviews-island";
import { MedicalDisclaimer } from "@/components/treatments/medical-disclaimer";
import { prisma } from "@/lib/db/client";
import { parseFilters } from "@/lib/discover/filters";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { TrilingualText } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";

export default async function ReviewsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const initialFilters = parseFilters(searchParams);
  const t = await getTranslations("reviews");

  const reviews = await prisma.review.findMany({
    where: { state: "published" },
    select: {
      id: true,
      code: true,
      body: true,
      rating: true,
      user: { select: { name: true } },
      clinic: { select: { slug: true, name: true, location: true } },
      treatment: { select: { slug: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // De-PII: ship only the first character of the customer's name.
  // The full name stays on the server (never crosses the network
  // boundary), so a client-side snapshot of the page state can't
  // leak it.
  const clientReviews: ClientReviewData[] = reviews.map((r) => {
    const loc = r.clinic?.location as { city?: unknown; cityI18n?: unknown } | null | undefined;
    const flatCity = typeof loc?.city === "string" ? loc.city : null;
    return {
      id: r.id,
      code: r.code,
      body: r.body as TrilingualText,
      rating: r.rating as 1 | 2 | 3 | 4 | 5,
      customerInitial: firstChar(r.user?.name ?? "?"),
      clinicSlug: r.clinic?.slug ?? null,
      clinicName: (r.clinic?.name as TrilingualText) ?? null,
      clinicCity: flatCity,
      clinicCityI18n: (loc?.cityI18n as TrilingualText) ?? null,
      treatmentSlug: r.treatment?.slug ?? null,
      treatmentTitle: (r.treatment?.title as TrilingualText) ?? null,
    };
  });

  // Pill options for treatment + clinic filters are the slug ∪ title
  // set visible in the current review list — no point offering a
  // pill that filters to zero results.
  const treatmentOptions = uniqBySlug(
    clientReviews
      .filter(
        (r): r is ClientReviewData & { treatmentSlug: string; treatmentTitle: TrilingualText } =>
          Boolean(r.treatmentSlug && r.treatmentTitle),
      )
      .map((r) => ({ slug: r.treatmentSlug, title: r.treatmentTitle })),
  );
  const clinicOptions = uniqBySlug(
    clientReviews
      .filter((r): r is ClientReviewData & { clinicSlug: string; clinicName: TrilingualText } =>
        Boolean(r.clinicSlug && r.clinicName),
      )
      .map((r) => ({ slug: r.clinicSlug, title: r.clinicName })),
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24 md:max-w-3xl">
      <header className="px-4 pt-8">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-ink-body">{t("subtitle")}</p>
      </header>
      <MedicalDisclaimer body={t("disclaimer.body")} ariaLabel={t("disclaimer.aria_label")} />
      <ReviewsIsland
        initialFilters={initialFilters}
        reviews={clientReviews}
        treatmentOptions={treatmentOptions}
        clinicOptions={clinicOptions}
        locale={activeLocale}
      />
    </main>
  );
}

function firstChar(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? Array.from(trimmed)[0]! : "?";
}

function uniqBySlug(options: readonly FilterOption[]): FilterOption[] {
  const seen = new Set<string>();
  const out: FilterOption[] = [];
  for (const o of options) {
    if (seen.has(o.slug)) continue;
    seen.add(o.slug);
    out.push(o);
  }
  return out;
}
