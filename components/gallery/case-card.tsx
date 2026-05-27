/*
 * components/gallery/case-card.tsx — single B/A case in the
 * gallery grid. Slider on top, locale-resolved caption below,
 * treatment + clinic meta line at the bottom (links to the
 * existing M2-03 / M2-04 detail routes).
 *
 * Server component — the slider's "use client" boundary lives
 * one layer deeper, so the card itself stays SSR-cacheable.
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { GalleryCase } from "@/lib/gallery/mock-cases";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";
import { BeforeAfterSlider } from "./before-after-slider";

interface Props {
  case_: GalleryCase;
  locale: Locale;
  /** Pre-resolved by the page so we don't fetch in every card. */
  treatmentTitle: TrilingualText | null;
  clinicName: TrilingualText | null;
  /** Localised labels for the slider's before / after caption + a11y. */
  labels: {
    before: string;
    after: string;
    sliderAria: string;
    captionLabel: string;
  };
}

export function CaseCard({ case_, locale, treatmentTitle, clinicName, labels }: Props) {
  const captionText = tr(case_.caption, locale);
  const treatmentText = treatmentTitle ? tr(treatmentTitle, locale) : "";
  const clinicText = clinicName ? tr(clinicName, locale) : "";
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <BeforeAfterSlider
          beforeTone={case_.beforeTone}
          afterTone={case_.afterTone}
          beforeLabel={labels.before}
          afterLabel={labels.after}
          ariaLabel={`${labels.sliderAria}: ${captionText}`}
        />
        <p className="break-keep text-sm font-medium text-ink-2">
          <span className="sr-only">{labels.captionLabel}: </span>
          {captionText}
        </p>
        {(treatmentText || clinicText) && (
          <p className="text-[11px] text-ink-mute">
            {treatmentText && (
              <Link
                href={`/${locale}/treatments/${case_.treatmentSlug}`}
                className="rounded text-ink-2 underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
              >
                {treatmentText}
              </Link>
            )}
            {treatmentText && clinicText && <span className="mx-1">·</span>}
            {clinicText && (
              <Link
                href={`/${locale}/clinics/${case_.clinicSlug}`}
                className="rounded text-ink-2 underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
              >
                {clinicText}
              </Link>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
