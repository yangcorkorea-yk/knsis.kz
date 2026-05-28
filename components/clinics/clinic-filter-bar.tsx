"use client";

/*
 * components/clinics/clinic-filter-bar.tsx — three filter axes
 * (Area / Kind / Language) for the M2-04 clinics list. Stateless.
 *
 * Each axis delegates to the shared <FilterAxis> primitive, which
 * auto-switches between pill row (≤ 7 options) and native dropdown
 * (≥ 8 options). Today every clinic axis has ≤ 4 options so they
 * all render as pills; the dropdown branch trips when an operator
 * grows the seeded clinic / treatment set past 7 in M5.
 */

import { useTranslations } from "next-intl";
import { FilterAxis } from "@/components/discover/filter-axis";
import {
  CITY_SLUGS,
  CLINIC_KINDS,
  type DiscoveryFilters,
  type FilterKey,
  INTERPRETER_LANGS,
} from "@/lib/discover/filters";

interface FilterBarProps {
  filters: DiscoveryFilters;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: (key: FilterKey) => void;
}

export function ClinicFilterBar({ filters, onToggle, onClear }: FilterBarProps) {
  const t = useTranslations("clinics.filter");
  return (
    <div className="space-y-3" role="group" aria-label={t("group_label")}>
      <FilterAxis
        axisId="clinics-area"
        groupLabel={t("area.label")}
        allLabel={t("area.all")}
        active={filters.area ?? null}
        options={CITY_SLUGS.map((v) => ({ value: v, label: t(`area.${v}`) }))}
        onSelect={(v) => onToggle("area", v)}
        onClear={() => onClear("area")}
      />
      <FilterAxis
        axisId="clinics-kind"
        groupLabel={t("kind.label")}
        allLabel={t("kind.all")}
        active={filters.kind ?? null}
        options={CLINIC_KINDS.map((v) => ({ value: v, label: t(`kind.${v}`) }))}
        onSelect={(v) => onToggle("kind", v)}
        onClear={() => onClear("kind")}
      />
      <FilterAxis
        axisId="clinics-language"
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
