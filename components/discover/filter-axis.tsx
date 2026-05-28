"use client";

/*
 * components/discover/filter-axis.tsx — shared filter axis primitive.
 *
 * Renders one of two shapes based on `options.length`:
 *
 *   ≤ 7 options → horizontal pill row (the M2-02 pattern: snap-x +
 *     overflow-x-auto + first:ml-4 / last:mr-4 gutters + scrollbar
 *     hidden via the scrollbar-none utility added in M2 polish).
 *   ≥ 8 options → native <select> dropdown. Native because:
 *     - keyboard accessibility comes for free (the platform widget)
 *     - mobile gets the OS picker chrome (familiar + searchable on
 *       iOS / Android)
 *     - one less custom combobox to maintain through M5 admin
 *       review
 *
 * Threshold lives at `PILL_THRESHOLD = 7`. Rationale + reversibility
 * captured in `docs/decisions/filter-axis-threshold.md`. Today's
 * data hits the dropdown path on Categories.concern (9 values);
 * post-M5 clinic-admin work pushes Clinics.clinic + Reviews.clinic
 * over the threshold once the operator registers more than 7 real
 * clinics. No code change at that point — the threshold flips the
 * shape automatically.
 *
 * Active state semantics:
 *   - active === null → the "All" pill / default option is selected.
 *   - active === <value> → that pill / option is selected.
 *   - Toggling an already-active value re-emits onClear (off-switch)
 *     for the pill path; the dropdown emits onClear when the user
 *     picks the default "All" option.
 *
 * a11y:
 *   - pill mode: <button aria-pressed> via the existing Pill primitive
 *   - dropdown mode: native <select> with locale-scoped <label
 *     sr-only> tied via `for=axisId`
 *   - focus rings: ink-mute (decoupled from rose) on both paths
 */

import { Pill } from "@/components/discover/filter-bar";

export const PILL_THRESHOLD = 7;

export interface FilterAxisOption {
  value: string;
  label: string;
}

interface Props {
  axisId: string;
  groupLabel: string;
  allLabel: string;
  active: string | null;
  options: readonly FilterAxisOption[];
  onSelect: (v: string) => void;
  onClear: () => void;
}

export function FilterAxis({
  axisId,
  groupLabel,
  allLabel,
  active,
  options,
  onSelect,
  onClear,
}: Props) {
  const usesDropdown = options.length > PILL_THRESHOLD;
  const groupId = `filter-axis-${axisId}`;
  return (
    <div aria-labelledby={groupId}>
      <h3
        id={groupId}
        className="mb-1.5 px-4 text-[11px] font-semibold uppercase tracking-widest text-ink-mute"
      >
        {groupLabel}
      </h3>
      {usesDropdown ? (
        <DropdownAxis
          axisId={axisId}
          allLabel={allLabel}
          active={active}
          options={options}
          onSelect={onSelect}
          onClear={onClear}
        />
      ) : (
        <PillAxis
          allLabel={allLabel}
          active={active}
          options={options}
          onSelect={onSelect}
          onClear={onClear}
        />
      )}
    </div>
  );
}

interface PillAxisProps {
  allLabel: string;
  active: string | null;
  options: readonly FilterAxisOption[];
  onSelect: (v: string) => void;
  onClear: () => void;
}

function PillAxis({ allLabel, active, options, onSelect, onClear }: PillAxisProps) {
  return (
    <div className="scrollbar-none flex snap-x snap-mandatory scroll-pl-4 scroll-pr-4 gap-2 overflow-x-auto pb-1">
      <Pill aria-pressed={active === null} onClick={onClear} highlighted={active === null}>
        {allLabel}
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
  );
}

interface DropdownAxisProps extends PillAxisProps {
  axisId: string;
}

function DropdownAxis({ axisId, allLabel, active, options, onSelect, onClear }: DropdownAxisProps) {
  const selectId = `filter-axis-select-${axisId}`;
  return (
    <div className="px-4">
      <label htmlFor={selectId} className="sr-only">
        {allLabel}
      </label>
      <select
        id={selectId}
        value={active ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") onClear();
          else onSelect(v);
        }}
        className="w-full rounded-md border border-line-soft bg-paper px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
