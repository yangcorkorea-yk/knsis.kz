import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/*
 * Badge — small chip used for verified marks, language tags, etc.
 * Matches docs/prototype/theme.jsx Badge() tones and sizes.
 */

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap",
  {
    variants: {
      tone: {
        rose: "bg-rose-soft text-rose-deep",
        lav: "bg-lavender-soft text-[#6E5A8C]",
        beige: "bg-beige-soft text-[#7A6A4A]",
        ink: "text-ink-2 bg-[#F2EFEC]",
        success: "bg-[#E5F4EC] text-[#1F7A4D]",
        korea: "text-rose-deep bg-[#FFF1F2]",
      },
      size: {
        sm: "px-2 py-[3px] text-[10.5px]",
        md: "px-2.5 py-[5px] text-xs",
      },
    },
    defaultVariants: {
      tone: "rose",
      size: "sm",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone, size, ...rest },
  ref,
) {
  return <span ref={ref} className={cn(badgeVariants({ tone, size }), className)} {...rest} />;
});

export { badgeVariants };
