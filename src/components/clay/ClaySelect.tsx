import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface Option {
  value: string;
  label: string;
}

interface ClaySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  hint?: string;
}

export const ClaySelect = forwardRef<HTMLSelectElement, ClaySelectProps>(
  ({ label, options, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={selectId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-describedby={hintId}
          className={cn(
            "bg-surface rounded-[var(--radius-sm)] px-4 py-3 text-ink appearance-none",
            "shadow-[var(--shadow-clay-recessed)] outline-none border border-transparent",
            "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && (
          <span id={hintId} className="text-xs text-ink-faint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);
ClaySelect.displayName = "ClaySelect";
