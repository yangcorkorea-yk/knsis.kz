"use client";

/*
 * components/discover/filter-bar.tsx — three filter axes (Area /
 * Concern / Language) for the M2-02 categories page. Stateless.
 *
 * Axis rendering is delegated to <FilterAxis>, which switches
 * automatically between pills (≤ 7 options) and a native dropdown
 * (≥ 8 options). Today's Concern axis lands in the dropdown
 * branch (9 TreatmentCategory values); Area + Language stay as
 * pills (4 each).
 *
 * Pill is still exported so the M2-02 Pill regression tests + the
 * M2-04 / M2-06 / M2-08 filter bars that reuse it continue to
 * work unchanged.
 */

import { useTranslations } from "next-intl";
import { FilterAxis } from "@/components/discover/filter-axis";
import {
  CITY_SLUGS,
  CONCERNS,
  type DiscoveryFilters,
  type FilterKey,
  INTERPRETER_LANGS,
} from "@/lib/discover/filters";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: DiscoveryFilters;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: (key: FilterKey) => void;
}

export function FilterBar({ filters, onToggle, onClear }: FilterBarProps) {
  const t = useTranslations("categories.filter");
  return (
    <div className="space-y-3" role="group" aria-label={t("group_label")}>
      <FilterAxis
        axisId="area"
        groupLabel={t("area.label")}
        allLabel={t("area.all")}
        active={filters.area ?? null}
        options={CITY_SLUGS.map((v) => ({ value: v, label: t(`area.${v}`) }))}
        onSelect={(v) => onToggle("area", v)}
        onClear={() => onClear("area")}
      />
      <FilterAxis
        axisId="concern"
        groupLabel={t("concern.label")}
        allLabel={t("concern.all")}
        active={filters.concern ?? null}
        options={CONCERNS.map((v) => ({ value: v, label: t(`concern.${v}`) }))}
        onSelect={(v) => onToggle("concern", v)}
        onClear={() => onClear("concern")}
      />
      <FilterAxis
        axisId="language"
        groupLabel={t("language.label")}
        allLabel={t("language.all")}
        active={filters.language ?? null}
        options={INTERPRETER_LANGS.map((v) => ({ value: v, label: t(`language.${v}`) }))}
        onSelect={(v) => onToggle("language", v)}
        onClear={() => onClear("language")}
      />
    </div>
  );
}

export function Pill({
  children,
  highlighted,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  highlighted: boolean;
}) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        // Scroll-row gutter: 16 px margin on the first + last pill
        // of any row (core Tailwind variants, always emit; the
        // arbitrary-variant version we tried at PR #6 / a35c6fb
        // didn't survive Tailwind's content scanner).
        "first:ml-4 last:mr-4",
        // Focus ring uses the neutral ink-mute (#8A8A8A) instead of any
        // rose tone — after a pill is tapped to off-switch, the
        // :focus-visible state lingers on the button until the user
        // clicks elsewhere, and a rose-tinted ring there reads as
        // "still active". Neutral gray keeps the focus indicator
        // visible (WCAG 1.4.11 — 3.28:1 against #FFFFFF, passes AA)
        // while staying decoupled from the active rose treatment.
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2",
        "snap-start",
        highlighted
          ? "border-rose bg-rose-tint text-rose-deep"
          : // Hover used to preview the active rose treatment
            // (`hover:border-rose hover:text-rose-deep`), which made
            // an off-switch tap leave a rose-tinted "still active"
            // look on the deactivated pill as long as the cursor
            // stayed over it. Decouple hover from rose, matching
            // the same intent we applied to the focus ring above.
            "border-line-soft bg-paper text-ink-2 hover:bg-ground hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
