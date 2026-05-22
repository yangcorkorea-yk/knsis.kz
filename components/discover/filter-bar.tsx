"use client";

/*
 * components/discover/filter-bar.tsx — three horizontally scrolling
 * pill rows (Area / Concern / Language) with optimistic feedback.
 *
 * Latency reality: Vercel ICN → IAD function + Supabase EU
 * round-trip puts the pill-tap → grid refresh at 1–2 s for KZ
 * users. Without immediate visual feedback the tap looked dead and
 * users would re-tap, which `toggleFilter` then read as a *second*
 * toggle → off-switch → user's intent inverted.
 *
 * The defence is a three-layer optimistic update:
 *
 *   1. `useTransition` wraps router.push so React tracks the
 *      navigation as a non-urgent update and exposes isPending.
 *   2. A local `optimistic` record holds the user's *intended*
 *      active value per axis until the server response lands.
 *      The pill renders from `optimistic[key] ?? searchParams.get(key)`
 *      so the highlight repaints synchronously on click.
 *   3. The pending pill grows a small pulsing dot (Tailwind
 *      animate-pulse) so the user can see "yes, this is loading."
 *      `data-pending` attribute is on the button for hover-spy
 *      tooling / future a11y-status work.
 *
 * Why not `useOptimistic`? React 18.3.1 doesn't export it (canary
 * channel only). Next.js 14 ships canary internally but the public
 * API surface still goes through the installed react package's
 * types. setState + useTransition is the portable equivalent.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { CITY_SLUGS, CONCERNS, INTERPRETER_LANGS, toggleFilter } from "@/lib/discover/filters";
import { cn } from "@/lib/utils";

type AxisKey = "area" | "concern" | "language";
type OptimisticMap = Partial<Record<AxisKey, string | null>>;

export function FilterBar() {
  const t = useTranslations("categories.filter");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<OptimisticMap>({});

  // Once the navigation resolves and searchParams catches up, drop
  // the optimistic overlay so the URL is the single source of truth
  // again. Without this the user would see stale optimistic state
  // if they navigated again via back/forward.
  useEffect(() => {
    if (!isPending) setOptimistic({});
  }, [isPending]);

  function effectiveActive(key: AxisKey): string | null {
    return key in optimistic ? (optimistic[key] ?? null) : searchParams.get(key);
  }

  function navigate(key: AxisKey, value: string) {
    const next = toggleFilter(new URLSearchParams(searchParams.toString()), key, value);
    const target = next.get(key); // null if the same value was tapped to clear
    setOptimistic((prev) => ({ ...prev, [key]: target }));
    startTransition(() => {
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function clearAxis(key: AxisKey) {
    setOptimistic((prev) => ({ ...prev, [key]: null }));
    startTransition(() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete(key);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="space-y-3" role="group" aria-label={t("group_label")}>
      <PillRow
        axis="area"
        labelKey="area.label"
        clearKey="area.all"
        values={CITY_SLUGS}
        labelOf={(v) => t(`area.${v}`)}
        active={effectiveActive("area")}
        isPending={isPending && "area" in optimistic}
        onSelect={(v) => navigate("area", v)}
        onClear={() => clearAxis("area")}
      />
      <PillRow
        axis="concern"
        labelKey="concern.label"
        clearKey="concern.all"
        values={CONCERNS}
        labelOf={(v) => t(`concern.${v}`)}
        active={effectiveActive("concern")}
        isPending={isPending && "concern" in optimistic}
        onSelect={(v) => navigate("concern", v)}
        onClear={() => clearAxis("concern")}
      />
      <PillRow
        axis="language"
        labelKey="language.label"
        clearKey="language.all"
        values={INTERPRETER_LANGS}
        labelOf={(v) => t(`language.${v}`)}
        active={effectiveActive("language")}
        isPending={isPending && "language" in optimistic}
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
  isPending: boolean;
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
  isPending,
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
        <Pill
          aria-pressed={active === null}
          onClick={onClear}
          highlighted={active === null}
          pending={isPending && active === null}
        >
          {t(clearKey)}
        </Pill>
        {values.map((v) => (
          <Pill
            key={v}
            aria-pressed={active === v}
            onClick={() => onSelect(v)}
            highlighted={active === v}
            pending={isPending && active === v}
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
  pending,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  highlighted: boolean;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      data-pending={pending ? "true" : undefined}
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-deep focus-visible:ring-offset-2",
        "snap-start",
        highlighted
          ? "border-rose bg-rose-tint text-rose-deep"
          : "border-line-soft bg-paper text-ink-2 hover:border-rose hover:text-rose-deep",
      )}
    >
      {children}
      {pending && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-deep"
        />
      )}
    </button>
  );
}
