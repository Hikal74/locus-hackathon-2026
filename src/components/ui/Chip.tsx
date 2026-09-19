import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { CheckIcon } from "./icons";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/** Toggleable chip for multi-select choices (interests, exams, ranked country picks). */
export function Chip({ selected = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium border transition-[background-color,border-color] duration-150",
        selected
          ? "bg-ink text-on-primary border-ink"
          : "bg-surface text-ink border-line-soft hover:border-line hover:bg-surface-raised",
        "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
        className
      )}
      {...props}
    >
      {selected && <CheckIcon width={12} height={12} />}
      {children}
    </button>
  );
}
