"use client";

/*
 * components/discover/filter-bar.tsx — three horizontally scrolling
 * pill rows (Area / Concern / Language). Each pill toggles its
 * value in the URL via `router.push`, server component re-renders
 * with the new searchParams.
 *
 * Why client: the URL toggle is a one-line `router.push` that needs
 * usePathname + useSearchParams. The server component upstream owns
 * data fetching; the FilterBar just renders + emits URL changes.
 *
 * Whitespace: every pill carries `whitespace-nowrap` so long KZ
 * labels (e.g. "Алматыдағы клиникалар"-style multi-word strings)
 * don't break mid-pill. Same defence as CTA in M2-01.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CITY_SLUGS, CONCERNS, INTERPRETER_LANGS, toggleFilter } from "@/lib/discover/filters";
import { cn } from "@/lib/utils";

type AxisKey = "area" | "concern" | "language";

export function FilterBar() {
  const t = useTranslations("categories.filter");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(key: AxisKey, value: string) {
    const next = toggleFilter(new URLSearchParams(searchParams.toString()), key, value);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearAxis(key: AxisKey) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(key);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-3" role="group" aria-label={t("group_label")}>
      <PillRow
        axis="area"
        labelKey="area.label"
        clearKey="area.all"
        values={CITY_SLUGS}
        labelOf={(v) => t(`area.${v}`)}
        active={searchParams.get("area")}
        onSelect={(v) => navigate("area", v)}
        onClear={() => clearAxis("area")}
      />
      <PillRow
        axis="concern"
        labelKey="concern.label"
        clearKey="concern.all"
        values={CONCERNS}
        labelOf={(v) => t(`concern.${v}`)}
        active={searchParams.get("concern")}
        onSelect={(v) => navigate("concern", v)}
        onClear={() => clearAxis("concern")}
      />
      <PillRow
        axis="language"
        labelKey="language.label"
        clearKey="language.all"
        values={INTERPRETER_LANGS}
        labelOf={(v) => t(`language.${v}`)}
        active={searchParams.get("language")}
        onSelect={(v) => navigate("language", v)}
        onClear={() => clearAxis("language")}
      />
    </div>
  );
}

interface PillRowProps<V extends string> {
  axis: AxisKey;
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
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 pl-4 pr-4">
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

function Pill({
  children,
  highlighted,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { highlighted: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-deep focus-visible:ring-offset-2",
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
