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
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium border-2 border-ink transition-[box-shadow,background-color,transform] duration-150",
        selected
          ? "bg-ink text-on-primary shadow-[var(--shadow-pressed)] translate-x-[1px] translate-y-[1px]"
          : "bg-paper text-ink shadow-[var(--shadow-raised)] hover:shadow-[var(--shadow-raised-hover)] hover:-translate-x-px hover:-translate-y-px",
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
