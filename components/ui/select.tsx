import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/*
 * Select — native <select>. Radix Select can land later when the design
 * needs an opinionated popover; the consult form (M3) and admin filters
 * (M5) ship with the native control for keyboard a11y and a tiny bundle.
 *
 * Background matches the Input primitive (bg-paper / #FFFFFF) so a
 * select sitting next to text inputs reads as the same affordance.
 * See components/ui/input.tsx for the rationale.
 */

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink transition-colors",
        "focus-visible:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
});
