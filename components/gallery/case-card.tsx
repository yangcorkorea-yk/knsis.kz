/*
 * components/gallery/case-card.tsx — list card for the B/A
 * gallery (M2-07 → M2-polish revision).
 *
 * Original M2-07 build rendered a full <BeforeAfterSlider> inline
 * on every list card; PM sign-off flipped to a list → detail
 * pattern matching Treatment / Clinic / Review surfaces. The
 * slider now lives on `/[locale]/before-after/[slug]`; the list
 * card shows a static split preview (two tone halves with a
 * thin vertical divider) plus the caption + meta line, and
 * wraps in a <Link> to the detail route.
 *
 * Static preview is intentional: the slider is the interactive
 * payoff of the detail page. A repeating interactive widget on
 * every list card competes with scroll + adds visual noise.
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { CaseTone, GalleryCase } from "@/lib/gallery/mock-cases";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";
import { cn } from "@/lib/utils";

// Duplicated from before-after-slider.tsx (the only other place
// that maps a CaseTone to a Tailwind gradient class). Two callers
// is below the M0 "extract on third use" threshold per CLAUDE.md §6.
const TONE_CLASSES: Record<CaseTone, string> = {
  warm: "bg-gradient-to-br from-warm to-ground",
  ground: "bg-gradient-to-br from-ground to-line-soft",
  "rose-tint": "bg-gradient-to-br from-rose-tint to-rose-soft",
  "rose-soft": "bg-gradient-to-br from-rose-soft to-rose-tint",
  "lavender-soft": "bg-gradient-to-br from-lavender-soft to-paper",
};

interface Props {
  case_: GalleryCase;
  locale: Locale;
  treatmentTitle: TrilingualText | null;
  clinicName: TrilingualText | null;
  labels: {
    before: string;
    after: string;
    captionLabel: string;
  };
}

export function CaseCard({ case_, locale, treatmentTitle, clinicName, labels }: Props) {
  const captionText = tr(case_.caption, locale);
  const treatmentText = treatmentTitle ? tr(treatmentTitle, locale) : "";
  const clinicText = clinicName ? tr(clinicName, locale) : "";
  return (
    <Link
      href={`/${locale}/before-after/${case_.slug}`}
      aria-label={captionText}
      className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
    >
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div
            aria-hidden="true"
            className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-line-soft"
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 flex w-1/2 items-end p-2",
                TONE_CLASSES[case_.beforeTone],
              )}
            >
              <span className="rounded-full bg-paper/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-ink-2 shadow-card">
                {labels.before}
              </span>
            </div>
            <div
              className={cn(
                "absolute inset-y-0 right-0 flex w-1/2 items-end justify-end p-2",
                TONE_CLASSES[case_.afterTone],
              )}
            >
              <span className="rounded-full bg-paper/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-deep shadow-card">
                {labels.after}
              </span>
            </div>
            {/* Static centre divider — the detail page's slider replaces this with a draggable handle. */}
            <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-paper" />
          </div>
          <p className="break-keep text-sm font-medium text-ink-2">
            <span className="sr-only">{labels.captionLabel}: </span>
            {captionText}
          </p>
          {(treatmentText || clinicText) && (
            <p className="text-[11px] text-ink-mute">
              {treatmentText}
              {treatmentText && clinicText && <span className="mx-1">·</span>}
              {clinicText}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
