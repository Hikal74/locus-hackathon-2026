import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ClayChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Toggleable chip for multi-select choices (interests, exams, ranked country picks). */
export function ClayChip({ selected = false, className, children, ...props }: ClayChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-[box-shadow,background-color] duration-150",
        selected
          ? "bg-primary text-on-primary shadow-[var(--shadow-clay-pressed)]"
          : "bg-surface text-ink-soft shadow-[var(--shadow-clay-raised)] hover:shadow-[var(--shadow-clay-raised-hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
