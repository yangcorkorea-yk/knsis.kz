"use client";

/*
 * components/discover/filter-bar.tsx — three horizontally scrolling
 * pill rows (Area / Concern / Language). Stateless.
 *
 * The owning <CategoriesIsland> holds the filter state and runs the
 * in-memory list filter; pills repaint synchronously when the parent
 * re-renders, with zero network round-trip. That's the whole point
 * of the client-side filtering refactor — see
 * docs/runbook/optimistic-feedback.md §"When client-side filtering
 * wins" for why this beat the previous useTransition + optimistic
 * pattern.
 *
 * Pill is exported so its rendered output can be locked down by unit
 * tests independently of the FilterBar composition.
 */

import { useTranslations } from "next-intl";
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
        axis="concern"
        labelKey="concern.label"
        clearKey="concern.all"
        values={CONCERNS}
        labelOf={(v) => t(`concern.${v}`)}
        active={filters.concern ?? null}
        onSelect={(v) => onToggle("concern", v)}
        onClear={() => onClear("concern")}
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
  const t = useTranslations("categories.filter");
  const groupId = `filter-${axis}`;
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
        // Bind the scrollable row's left / right padding to the first
        // and last pill themselves. Container padding on a horizontal
        // overflow:auto box is unreliable across browsers, and the
        // earlier arbitrary-variant attempt (`[&>*:first-child]:ml-4`)
        // didn't survive Tailwind's default content scanner. Plain
        // first: / last: variants are core Tailwind and always emit.
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
          : "border-line-soft bg-paper text-ink-2 hover:border-rose hover:text-rose-deep",
      )}
    >
      {children}
    </button>
  );
}
