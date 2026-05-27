"use client";

/*
 * components/gallery/before-after-slider.tsx — drag-to-reveal
 * compare component. Two stacked layers; the After layer's
 * clip-path narrows as the handle moves left, revealing the
 * Before layer underneath.
 *
 * MVP uses CSS gradient placeholders (no binary image files);
 * the M5 admin moderation pass swaps the props to image src
 * paths backed by Supabase Storage signed URLs without changing
 * the slider mechanics.
 *
 * a11y:
 *   - role="slider" with aria-valuemin/max/now so screen readers
 *     announce the reveal percentage
 *   - Keyboard: ArrowLeft / ArrowRight step the handle by 5 pp,
 *     Home / End jump to 0 / 100
 *   - Pointer events (unified mouse + touch) for drag
 *   - Click anywhere on the surface jumps the handle there
 *
 * Hard rules: no PII, no monetary fields, no medical-claim copy
 * inside this component — labels come from i18n via props.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CaseTone } from "@/lib/gallery/mock-cases";

const TONE_CLASSES: Record<CaseTone, string> = {
  warm: "bg-gradient-to-br from-warm to-ground",
  ground: "bg-gradient-to-br from-ground to-line-soft",
  "rose-tint": "bg-gradient-to-br from-rose-tint to-rose-soft",
  "rose-soft": "bg-gradient-to-br from-rose-soft to-rose-tint",
  "lavender-soft": "bg-gradient-to-br from-lavender-soft to-paper",
};

interface Props {
  beforeTone: CaseTone;
  afterTone: CaseTone;
  beforeLabel: string;
  afterLabel: string;
  ariaLabel: string;
}

const STEP = 5;

export function BeforeAfterSlider({
  beforeTone,
  afterTone,
  beforeLabel,
  afterLabel,
  ariaLabel,
}: Props) {
  const [reveal, setReveal] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setReveal(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setDragging(true);
      updateFromClientX(e.clientX);
      // Capture so move events keep firing if the pointer leaves the box.
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    },
    [updateFromClientX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      updateFromClientX(e.clientX);
    },
    [dragging, updateFromClientX],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      setReveal((v) => Math.max(0, v - STEP));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setReveal((v) => Math.min(100, v + STEP));
      e.preventDefault();
    } else if (e.key === "Home") {
      setReveal(0);
      e.preventDefault();
    } else if (e.key === "End") {
      setReveal(100);
      e.preventDefault();
    }
  }, []);

  // Defensive: reset cursor + drag state if the component unmounts
  // mid-drag (e.g. route navigation).
  useEffect(() => {
    return () => setDragging(false);
  }, []);

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(reveal)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={cn(
        "relative aspect-[4/3] w-full select-none overflow-hidden rounded-md border border-line-soft",
        "cursor-ew-resize touch-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2",
      )}
    >
      {/* Before layer — full size underneath. */}
      <div
        aria-hidden="true"
        className={cn("absolute inset-0 flex items-end p-3", TONE_CLASSES[beforeTone])}
      >
        <span className="rounded-full bg-paper/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink-2 shadow-card">
          {beforeLabel}
        </span>
      </div>

      {/* After layer — clipped from the right so the handle's
          x-position is the visible boundary. */}
      <div
        aria-hidden="true"
        className={cn("absolute inset-0 flex items-end justify-end p-3", TONE_CLASSES[afterTone])}
        style={{ clipPath: `inset(0 0 0 ${reveal}%)` }}
      >
        <span className="rounded-full bg-paper/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-rose-deep shadow-card">
          {afterLabel}
        </span>
      </div>

      {/* Vertical handle bar + circular grab button. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-paper shadow-cta"
        style={{ left: `${reveal}%` }}
      >
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-rose-deep shadow-cta">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 5 3 12l5 7" />
            <path d="M16 5l5 7-5 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}
