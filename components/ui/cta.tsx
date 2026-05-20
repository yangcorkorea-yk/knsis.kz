import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * CTA — primary action button. Matches docs/prototype/theme.jsx CTA().
 *
 * Prototype variants (primary, soft, outline, ink) and sizes (lg, md, sm)
 * are preserved. The prototype's full-width default is preserved via the
 * `fullWidth` prop (defaulting to true to mirror the source).
 */

const ctaVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-semibold tracking-tight transition-transform " +
    "active:scale-[0.97] active:opacity-85 disabled:pointer-events-none disabled:opacity-50 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-deep focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-rose text-white shadow-cta hover:bg-rose-deep",
        soft: "bg-rose-tint text-rose-deep hover:bg-rose-soft",
        outline: "border-line border bg-paper text-ink hover:bg-ground",
        ink: "bg-ink text-white hover:bg-ink-2",
      },
      size: {
        lg: "rounded-lg px-5 py-4 text-[15px]",
        md: "rounded-md px-4 py-3 text-[13.5px]",
        sm: "rounded px-3 py-2 text-[12.5px]",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      fullWidth: true,
    },
  },
);

export interface CTAProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof ctaVariants> {
  icon?: ReactNode;
  asChild?: boolean;
}

export const CTA = forwardRef<HTMLButtonElement, CTAProps>(function CTA(
  { className, variant, size, fullWidth, icon, asChild, children, ...rest },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp ref={ref} className={cn(ctaVariants({ variant, size, fullWidth }), className)} {...rest}>
      {icon}
      {children}
    </Comp>
  );
});

export { ctaVariants };
