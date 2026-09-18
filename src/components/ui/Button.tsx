import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-on-primary border border-ink hover:opacity-90",
  accent: "bg-transparent text-ink border border-ink hover:bg-surface",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-raised",
  ghost: "bg-transparent text-ink border border-transparent shadow-none hover:bg-surface",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-[var(--radius-pill)]",
  md: "px-6 py-2.5 text-base rounded-[var(--radius-pill)]",
  lg: "px-8 py-3.5 text-lg rounded-[var(--radius-pill)]",
};

/**
 * Flat pill button — no offset shadow, depth carried by a hairline border
 * plus a subtle opacity/background shift on hover, pressed state included.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-semibold transition-[background-color,opacity,transform] duration-150 ease-out active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
          "disabled:opacity-40 disabled:pointer-events-none",
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
Button.displayName = "Button";
