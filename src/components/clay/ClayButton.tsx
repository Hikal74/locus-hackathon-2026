import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-on-primary",
  accent: "bg-accent text-on-accent",
  secondary: "bg-surface-raised text-ink",
  ghost: "bg-transparent text-ink shadow-none hover:bg-surface",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-[var(--radius-sm)]",
  md: "px-6 py-3 text-base rounded-[var(--radius-md)]",
  lg: "px-8 py-4 text-lg rounded-[var(--radius-md)]",
};

/**
 * Tactile clay button: rests raised, compresses on press.
 * Shadow pair (not scale) carries the "physical" feedback so it stays
 * legible for reduced-motion users too.
 */
export const ClayButton = forwardRef<HTMLButtonElement, ClayButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-medium transition-[box-shadow,transform] duration-150 ease-out",
          "shadow-[var(--shadow-clay-raised)]",
          "hover:shadow-[var(--shadow-clay-raised-hover)]",
          "active:shadow-[var(--shadow-clay-pressed)] active:translate-y-[1px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base",
          "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-[var(--shadow-clay-pressed)]",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
ClayButton.displayName = "ClayButton";
