"use client";

/*
 * components/clinics/clinic-filter-bar.tsx — three pill rows for
 * the /[locale]/clinics list (city / kind / language). Stateless,
 * same shape as `components/discover/filter-bar.tsx` from M2-02 —
 * reuses the exported Pill primitive for visual + a11y parity
 * (rose active treatment, ink-mute focus ring, no rose hover, the
 * scroll-row first/last gutter on every Pill).
 *
 * Filter state lives in the owning <ClinicsIsland>; pill repaints
 * happen synchronously since all filtering runs in-memory over the
 * bulk-fetched clinic set.
 */

import { useTranslations } from "next-intl";
import {
  CITY_SLUGS,
  CLINIC_KINDS,
  type DiscoveryFilters,
  type FilterKey,
  INTERPRETER_LANGS,
} from "@/lib/discover/filters";
import { Pill } from "@/components/discover/filter-bar";

interface FilterBarProps {
  filters: DiscoveryFilters;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: (key: FilterKey) => void;
}

export function ClinicFilterBar({ filters, onToggle, onClear }: FilterBarProps) {
  const t = useTranslations("clinics.filter");
  return (
    <div className="space-y-3" role="group" aria-label={t("group_label")}>
      <PillRow
        axis="area"
        labelKey="area.label"
        clearKey="area.all"
        values={CITY_SLUGS}
        labelOf={(v) => t(`area.${v}`)}
        active={filters.area ?? null}
        onSelect={(v) => onToggle("area", v)}
        onClear={() => onClear("area")}
      />
      <PillRow
        axis="kind"
        labelKey="kind.label"
        clearKey="kind.all"
        values={CLINIC_KINDS}
        labelOf={(v) => t(`kind.${v}`)}
        active={filters.kind ?? null}
        onSelect={(v) => onToggle("kind", v)}
        onClear={() => onClear("kind")}
      />
      <PillRow
        axis="language"
        labelKey="language.label"
        clearKey="language.all"
        values={INTERPRETER_LANGS}
        labelOf={(v) => t(`language.${v}`)}
        active={filters.language ?? null}
        onSelect={(v) => onToggle("language", v)}
        onClear={() => onClear("language")}
      />
    </div>
  );
}

interface PillRowProps<V extends string> {
  axis: FilterKey;
  labelKey: string;
  clearKey: string;
  values: readonly V[];
  labelOf: (v: V) => string;
  active: string | null;
  onSelect: (v: V) => void;
  onClear: () => void;
}

function PillRow<V extends string>({
  axis,
  labelKey,
  clearKey,
  values,
  labelOf,
  active,
  onSelect,
  onClear,
}: PillRowProps<V>) {
  const t = useTranslations("clinics.filter");
  const groupId = `clinic-filter-${axis}`;
  return (
    <div aria-labelledby={groupId}>
      <h3
        id={groupId}
        className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-ink-mute"
      >
        {t(labelKey)}
      </h3>
      <div className="flex snap-x snap-mandatory scroll-pl-4 scroll-pr-4 gap-2 overflow-x-auto pb-1">
        <Pill aria-pressed={active === null} onClick={onClear} highlighted={active === null}>
          {t(clearKey)}
        </Pill>
        {values.map((v) => (
          <Pill
            key={v}
            aria-pressed={active === v}
            onClick={() => onSelect(v)}
            highlighted={active === v}
          >
            {labelOf(v)}
          </Pill>
        ))}
      </div>
    </div>
  );
}
