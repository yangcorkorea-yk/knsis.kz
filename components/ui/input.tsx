import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/*
 * Input — single-line text input. Pretendard via inherited font-sans.
 *
 * Background is `bg-paper` (#FFFFFF) so the field stands out against
 * the page's `bg-warm` (#FBF8F5). The M3 sign-off matrix surfaced
 * that the previous `bg-ground` (#F7F4F0) was only ~4 hex points
 * darker than the page background — users couldn't recognise the
 * field boundary at a glance. Border (`border-line` = #ECE8E3)
 * provides the affordance edge; rose-soft focus ring matches the
 * site's CTA accent.
 */

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink transition-colors placeholder:text-ink-mute",
        "focus-visible:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...rest}
    />
  );
});
