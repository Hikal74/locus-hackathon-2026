import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-ink text-on-primary border-2 border-ink",
  accent: "bg-paper text-ink border-[3px] border-ink",
  secondary: "bg-paper text-ink border-2 border-ink",
  ghost: "bg-transparent text-ink border-2 border-transparent shadow-none hover:border-line-soft",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-[var(--radius-sm)]",
  md: "px-6 py-3 text-base rounded-[var(--radius-md)]",
  lg: "px-8 py-4 text-lg rounded-[var(--radius-md)]",
};

/**
 * Editorial/brutalist button: rests on a hard offset shadow, presses down
 * onto it. Depth is carried entirely by shadow + translate, not color.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "font-medium transition-[box-shadow,transform] duration-150 ease-out",
          variant !== "ghost" && "shadow-[var(--shadow-raised)]",
          variant !== "ghost" && "hover:shadow-[var(--shadow-raised-hover)] hover:-translate-x-px hover:-translate-y-px",
          variant !== "ghost" &&
            "active:shadow-[var(--shadow-pressed)] active:translate-x-[3px] active:translate-y-[3px]",
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
