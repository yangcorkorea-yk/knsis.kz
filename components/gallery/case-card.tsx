"use client";

/*
 * components/gallery/case-card.tsx — single feed card for the
 * Before/After gallery (M2-07 Iteration 3b).
 *
 * Iteration 3b PM decision: 4 small thumbnails in a row at the
 * top of the card (강남언니 캡처 4 pattern). The user evaluates
 * the case at a glance — all 4 angles are visible side-by-side
 * without a swipe gesture. Tapping any thumbnail opens an
 * <ImageModal> lightbox for close-up viewing with left/right
 * navigation across the 4 angles. The earlier Iteration 3a
 * (1 image full-width + scroll-snap swipe + page dots) is
 * retired — full history in
 * `docs/decisions/before-after-pattern.md`.
 *
 * Layout below the thumbnail row is unchanged from 3a:
 *   - caption
 *   - procedure as a #tag link → M2-03 treatment detail
 *   - user interview blockquote — trust artefact
 *   - clinic meta link → M2-04 clinic detail
 *
 * Client component because the modal trigger needs state
 * (which thumbnail was tapped → initialIndex). The rest of the
 * card renders on the server before hydration; this is a small
 * client boundary, not a regression of the SSR strategy.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageModal, type ImageModalLabels } from "@/components/gallery/image-modal";
import type { CaseTone, GalleryCase } from "@/lib/gallery/mock-cases";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";
import { cn } from "@/lib/utils";

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
    /** Modal a11y + control labels. */
    modal: ImageModalLabels;
  };
}

export function CaseCard({ case_, locale, treatmentTitle, clinicName, labels }: Props) {
  const captionText = tr(case_.caption, locale);
  const interviewText = tr(case_.interview, locale);
  const treatmentText = treatmentTitle ? tr(treatmentTitle, locale) : "";
  const clinicText = clinicName ? tr(clinicName, locale) : "";

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function closeModal() {
    const returnIndex = openIndex;
    setOpenIndex(null);
    if (returnIndex != null) {
      // Return focus to the thumbnail that opened the modal.
      requestAnimationFrame(() => thumbRefs.current[returnIndex]?.focus());
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* 4-thumbnail row at the top edge — full-bleed across the card. */}
      <div className="grid grid-cols-4 gap-1 p-1" aria-label={captionText}>
        {case_.images.map((img, i) => (
          <button
            key={i}
            ref={(el) => {
              thumbRefs.current[i] = el;
            }}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={tr(img.alt, locale)}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className={cn("block aspect-square w-full rounded-md", TONE_CLASSES[img.tone])}
            />
          </button>
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

      {openIndex != null && (
        <ImageModal
          images={case_.images}
          initialIndex={openIndex}
          locale={locale}
          labels={labels.modal}
          onClose={closeModal}
        />
      )}
    </Card>
  );
}
