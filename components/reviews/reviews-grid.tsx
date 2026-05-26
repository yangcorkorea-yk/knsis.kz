"use client";

/*
 * components/reviews/reviews-grid.tsx — client-filtered list of
 * ReviewCard. Same shape as M2-04 ClinicsGrid: useFilterableList
 * with the shared `matchReview` predicate over the bulk dataset
 * fetched once by the server.
 *
 * No PII rendered. Server already filters by state=published.
 */

import { useTranslations } from "next-intl";
import { type DiscoveryFilters, matchReview } from "@/lib/discover/filters";
import { useFilterableList } from "@/lib/discover/use-filterable-list";
import type { Locale } from "@/lib/i18n/config";
import { ReviewCard, type ClientReviewData } from "./review-card";

interface Props {
  filters: DiscoveryFilters;
  reviews: readonly ClientReviewData[];
  locale: Locale;
}

export function ReviewsGrid({ filters, reviews, locale }: Props) {
  const t = useTranslations("reviews");
  const visible = useFilterableList(reviews, filters, matchReview);
  if (visible.length === 0) {
    return <p className="px-4 text-sm text-ink-mute">{t("empty")}</p>;
  }
  return (
    <ul className="flex flex-col gap-3 px-4">
      {visible.map((review) => (
        <li key={review.id}>
          <ReviewCard review={review} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
