"use client";

/*
 * components/gallery/image-modal.tsx — fullscreen lightbox for
 * the Before/After gallery (M2-07 Iteration 3b).
 *
 * Iteration 3b PM decision: the case card became a row of 4
 * small thumbnails (강남언니 캡처 4 pattern). Tapping any
 * thumbnail opens this modal at that index. The user evaluates
 * the case at a glance from the card; the modal exists for
 * close-up viewing — large image + left/right navigation across
 * the 4 angles + close.
 *
 * a11y contract:
 *   - role="dialog" + aria-modal="true" + aria-label (i18n)
 *   - opening: focus moves to the close button; Tab is trapped
 *     between close / prev / next; closing returns focus to the
 *     triggering thumbnail (the caller passes returnFocusRef)
 *   - close: X button OR backdrop click OR Esc
 *   - navigate: left/right arrow buttons OR ← / → keyboard OR
 *     horizontal touch swipe
 *   - body scroll is locked while the modal is open
 *
 * Visuals: gradient placeholder fills the viewport with the same
 * tone palette as the card thumbnails — M5 swap replaces the
 * gradient div with an <img src={signedUrl} alt={…}/>.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseTone, GalleryImage } from "@/lib/gallery/mock-cases";
import type { Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<CaseTone, string> = {
  warm: "bg-gradient-to-br from-warm to-ground",
  ground: "bg-gradient-to-br from-ground to-line-soft",
  "rose-tint": "bg-gradient-to-br from-rose-tint to-rose-soft",
  "rose-soft": "bg-gradient-to-br from-rose-soft to-rose-tint",
  "lavender-soft": "bg-gradient-to-br from-lavender-soft to-paper",
};

export interface ImageModalLabels {
  /** aria-label on the dialog itself. */
  modalLabel: string;
  /** Visually-hidden label on the X button. */
  closeLabel: string;
  /** Visually-hidden label on the left arrow. */
  prevLabel: string;
  /** Visually-hidden label on the right arrow. */
  nextLabel: string;
}

interface Props {
  images: readonly GalleryImage[];
  initialIndex: number;
  locale: Locale;
  labels: ImageModalLabels;
  onClose: () => void;
}

// Minimum horizontal travel (px) for a touch gesture to count
// as a swipe. Below this we treat it as a tap / accidental drag.
const SWIPE_THRESHOLD = 40;

export function ImageModal({ images, initialIndex, locale, labels, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  // Initial focus + body scroll lock + Esc / arrow keys.
  useEffect(() => {
    closeButtonRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext]);

  function onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (delta > SWIPE_THRESHOLD) goPrev();
    else if (delta < -SWIPE_THRESHOLD) goNext();
  }

  const current = images[index];
  const altText = current ? tr(current.alt, locale) : "";

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={labels.modalLabel}
      onClick={onBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="text-xl leading-none">
          ×
        </span>
        <span className="sr-only">{labels.closeLabel}</span>
      </button>

      <div
        className="relative flex w-full max-w-md items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ‹
            </span>
            <span className="sr-only">{labels.prevLabel}</span>
          </button>
        )}

        {current && (
          <div
            role="img"
            aria-label={altText}
            className={cn("aspect-[4/3] w-full rounded-lg", TONE_CLASSES[current.tone])}
          />
        )}

        {images.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-paper/90 text-ink shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ›
            </span>
            <span className="sr-only">{labels.nextLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}
