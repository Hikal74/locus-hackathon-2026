import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon } from "./icons";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={selectId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-describedby={hintId}
            className={cn(
              "w-full bg-surface rounded-[var(--radius-sm)] pl-4 pr-10 py-3 text-ink appearance-none",
              "outline-none border border-line",
              "focus-visible:shadow-[var(--ring-focus)] focus-visible:border-ink",
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
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
        {hint && (
          <span id={hintId} className="text-xs text-ink-faint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
