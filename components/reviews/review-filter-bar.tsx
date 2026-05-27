"use client";

/*
 * components/reviews/review-filter-bar.tsx — three pill rows for
 * the M2-06 reviews feed (area / treatment / clinic). Stateless;
 * <ReviewsIsland> owns the filter state.
 *
 * The treatment + clinic pills are data-driven (not enum-bounded):
 * the server passes the slug + locale-aware title for every option
 * that appears in the visible review set, the pill renders the
 * localised name via tr.ts.
 *
 * Reuses the M2-02 Pill primitive for visual + a11y parity (rose
 * active treatment, ink-mute focus ring, no rose hover, scroll-row
 * gutter via first:ml-4 last:mr-4).
 */

import { useTranslations } from "next-intl";
import { Pill } from "@/components/discover/filter-bar";
import { CITY_SLUGS, type DiscoveryFilters, type FilterKey } from "@/lib/discover/filters";
import type { Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";

export interface FilterOption {
  slug: string;
  title: TrilingualText;
}

interface Props {
  filters: DiscoveryFilters;
  treatmentOptions: readonly FilterOption[];
  clinicOptions: readonly FilterOption[];
  locale: Locale;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: (key: FilterKey) => void;
}

export function ReviewFilterBar({
  filters,
  treatmentOptions,
  clinicOptions,
  locale,
  onToggle,
  onClear,
}: Props) {
  const t = useTranslations("reviews.filter");
  return (
    <div className="space-y-3" role="group" aria-label={t("group_label")}>
      <PillRow
        axisId="area"
        label={t("area.label")}
        clearLabel={t("area.all")}
        active={filters.area ?? null}
        options={CITY_SLUGS.map((slug) => ({ value: slug, label: t(`area.${slug}`) }))}
        onSelect={(v) => onToggle("area", v)}
        onClear={() => onClear("area")}
      />
      <PillRow
        axisId="treatment"
        label={t("treatment.label")}
        clearLabel={t("treatment.all")}
        active={filters.treatment ?? null}
        options={treatmentOptions.map((o) => ({ value: o.slug, label: tr(o.title, locale) }))}
        onSelect={(v) => onToggle("treatment", v)}
        onClear={() => onClear("treatment")}
      />
      <PillRow
        axisId="clinic"
        label={t("clinic.label")}
        clearLabel={t("clinic.all")}
        active={filters.clinic ?? null}
        options={clinicOptions.map((o) => ({ value: o.slug, label: tr(o.title, locale) }))}
        onSelect={(v) => onToggle("clinic", v)}
        onClear={() => onClear("clinic")}
      />
    </div>
  );
}

interface PillRowProps {
  axisId: FilterKey;
  label: string;
  clearLabel: string;
  active: string | null;
  options: readonly { value: string; label: string }[];
  onSelect: (v: string) => void;
  onClear: () => void;
}

function PillRow({ axisId, label, clearLabel, active, options, onSelect, onClear }: PillRowProps) {
  const groupId = `review-filter-${axisId}`;
  return (
    <div aria-labelledby={groupId}>
      <h3
        id={groupId}
        className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-ink-mute"
      >
        {label}
      </h3>
      <div className="flex snap-x snap-mandatory scroll-pl-4 scroll-pr-4 gap-2 overflow-x-auto pb-1">
        <Pill aria-pressed={active === null} onClick={onClear} highlighted={active === null}>
          {clearLabel}
        </Pill>
        {options.map((o) => (
          <Pill
            key={o.value}
            aria-pressed={active === o.value}
            onClick={() => onSelect(o.value)}
            highlighted={active === o.value}
          >
            {o.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}
