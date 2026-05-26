"use client";

/*
 * components/reviews/review-card.tsx — single review in the M2-06
 * feed. Pure presentation; never touches PII beyond a masked initial.
 *
 * Visual: matches the prototype review block (`docs/prototype/
 * screens-a.jsx` line 660). 26 px rose-tint avatar circle with the
 * customer's first letter, masked name (`Ә.`), location (clinic
 * city), 5-star rating row, body text in user's locale via tr.ts.
 *
 * PII masking: the seed customer_name field only ever lands here
 * as the first character. The full name lives on the User row
 * (FK target) but is never serialised into the ClientReviewData
 * the server hands the island, so a client-side snapshot can't
 * leak it.
 */

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";

export interface ClientReviewData {
  id: string;
  code: string;
  /** Locale-aware body — populated for kz/ru/kr by the M2-09 seed. */
  body: TrilingualText;
  rating: 1 | 2 | 3 | 4 | 5;
  /** Single character used as the avatar + masked display ("Ә." form). */
  customerInitial: string;
  /** Clinic + treatment slugs travel through for filter matching; their
   * locale-aware display names ride along as TrilingualText so the
   * card can render them without a second DB call. */
  clinicSlug: string | null;
  clinicName: TrilingualText | null;
  clinicCity: string | null;
  clinicCityI18n: TrilingualText | null;
  treatmentSlug: string | null;
  treatmentTitle: TrilingualText | null;
}

interface Props {
  review: ClientReviewData;
  locale: Locale;
}

export function ReviewCard({ review, locale }: Props) {
  const t = useTranslations("reviews");
  const bodyText = tr(review.body, locale);
  const clinicName = review.clinicName ? tr(review.clinicName, locale) : "";
  const treatmentTitle = review.treatmentTitle ? tr(review.treatmentTitle, locale) : "";
  const cityDisplay = review.clinicCityI18n
    ? tr(review.clinicCityI18n, locale)
    : (review.clinicCity ?? "");
  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-label={t("card.anonymous_avatar_label")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-tint text-xs font-bold text-rose-deep"
            >
              {review.customerInitial}
            </span>
            <div className="min-w-0 text-xs text-ink-mute">
              <p>
                <span className="font-semibold text-ink-2">{review.customerInitial}.</span>
                {cityDisplay && <span className="ml-1">· {cityDisplay}</span>}
              </p>
            </div>
          </div>
          <div
            className="shrink-0 text-sm font-semibold text-rose-deep"
            aria-label={t("rating_label", { rating: review.rating })}
          >
            <span aria-hidden="true">{"★".repeat(review.rating)}</span>
            <span aria-hidden="true" className="text-line">
              {"★".repeat(5 - review.rating)}
            </span>
          </div>
        </div>
        <p className="break-keep text-sm text-ink-2">{bodyText}</p>
        {(clinicName || treatmentTitle) && (
          <p className="text-[11px] text-ink-mute">
            {clinicName}
            {clinicName && treatmentTitle && <span className="mx-1">·</span>}
            {treatmentTitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
