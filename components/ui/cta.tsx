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
 *
 * asChild + Slot subtlety: Radix Slot calls React.Children.only on its
 * children. JSX like
 *   <Slot>
 *     {icon}     // ← undefined or a node
 *     {children}
 *   </Slot>
 * passes BOTH expressions to createElement, so the children array is
 * always [icon, children] — even when icon is undefined. React.Children.
 * only sees an array and throws (error #143). To stay safe under asChild,
 * we pass exactly one child to Slot and refuse the icon prop. Without
 * asChild we render <button>{icon}{children}</button>; a button is happy
 * with multiple children, no Children.only on the path.
 *
 * Caller pattern (unchanged from M0-05):
 *   <CTA asChild><Link href="/x">Click</Link></CTA>
 *   <CTA icon={<X />}>Click</CTA>
 * The combination asChild + icon is not supported — defer to the wrapped
 * element's own composition (e.g. put the icon inside the <Link>).
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
  const merged = cn(ctaVariants({ variant, size, fullWidth }), className);
  if (asChild) {
    // Slot needs exactly one child. The `icon` prop is ignored on
    // purpose here — the wrapped element (Link / a / etc.) owns its
    // own content composition.
    return (
      <Slot ref={ref} className={merged} {...rest}>
        {children}
      </Slot>
    );
  }
  return (
    <button ref={ref} className={merged} {...rest}>
      {icon}
      {children}
    </button>
  );
});

export { ctaVariants };
