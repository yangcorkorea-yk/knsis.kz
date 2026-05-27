/*
 * components/gallery/case-card.tsx — single feed card for the
 * Before/After gallery (M2-07 Iteration 3).
 *
 * Single-depth pattern (no list → detail). The card carries
 * everything the user needs to evaluate the case:
 *   - 4-image horizontal-swipe row (2 before + 2 after) at the
 *     top edge of the card, full-bleed
 *   - static page indicator dots (4 dots, MVP scope; the
 *     active-dot tracking that would need scroll JS is M5)
 *   - caption
 *   - procedure as a #tag — link to the M2-03 treatment detail
 *   - user interview blockquote — the trust artefact this
 *     surface exists for
 *   - clinic meta link — M2-04 clinic detail
 *
 * Server component. The horizontal swipe is pure CSS (snap-x
 * + overflow-x-auto + scrollbar-none); touch devices get
 * native swipe without JS, and vertical page scroll keeps
 * working because the swipe row's own scroll context owns
 * horizontal gestures.
 *
 * Visual reference: KR medical-aesthetic feed pattern
 * (강남언니) — depth 0, image-first, social-trust copy.
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { CaseTone, GalleryCase } from "@/lib/gallery/mock-cases";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";
import { cn } from "@/lib/utils";

// Tone → Tailwind gradient class. Duplicated from earlier slider
// drafts; only this component renders gradients now (the slider
// + its split-preview card variant were removed in Iteration 3).
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
    /** "후기" / "Отзыв" / "Пікір" — sr-only prefix on the interview blockquote. */
    interviewLabel: string;
  };
}

export function CaseCard({ case_, locale, treatmentTitle, clinicName, labels }: Props) {
  const captionText = tr(case_.caption, locale);
  const interviewText = tr(case_.interview, locale);
  const treatmentText = treatmentTitle ? tr(treatmentTitle, locale) : "";
  const clinicText = clinicName ? tr(clinicName, locale) : "";
  return (
    <Card className="overflow-hidden">
      {/* Image swipe row — full-bleed (breaks out of CardContent padding). */}
      <div
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
        aria-label={captionText}
      >
        {case_.images.map((img, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={cn("aspect-[4/3] w-full shrink-0 snap-start", TONE_CLASSES[img.tone])}
          />
        ))}
      </div>

      {/* Static page indicator dots. M5 swap path: bind active dot
          to scrollLeft via a useEffect — out of MVP scope. */}
      <div className="flex justify-center gap-1.5 pt-3" aria-hidden="true">
        {case_.images.map((_, i) => (
          <span key={i} className="block h-1.5 w-1.5 rounded-full bg-ink-mute/40" />
        ))}
      </div>

      <CardContent className="space-y-3 pt-3">
        <p className="break-keep text-sm font-semibold text-ink">{captionText}</p>

        {treatmentText && (
          <Link
            href={`/${locale}/treatments/${case_.treatmentSlug}`}
            className="inline-flex items-center rounded text-xs font-medium text-rose-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
          >
            #{treatmentText}
          </Link>
        )}

        {interviewText && (
          <blockquote className="rounded-md border-l-2 border-rose bg-rose-tint/40 px-3 py-2 text-sm leading-relaxed text-ink-2">
            <span className="sr-only">{labels.interviewLabel}: </span>
            {interviewText}
          </blockquote>
        )}

        {clinicText && (
          <Link
            href={`/${locale}/clinics/${case_.clinicSlug}`}
            className="inline-block rounded text-[11px] text-ink-mute underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
          >
            {clinicText}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
