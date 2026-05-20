import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/*
 * Input — single-line text input. Pretendard via inherited font-sans.
 * Underlying styling is uniform across the consult form (M3) and
 * admin filters (M5).
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
        "flex h-11 w-full rounded-md border border-line bg-ground px-3 text-sm text-ink transition-colors placeholder:text-ink-mute",
        "focus-visible:border-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...rest}
    />
  );
});
