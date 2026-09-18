import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";
import { WarningIcon } from "./icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Recessed field — thin inset shadow reads as "pressed into" the page, label always visible. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-describedby={cn(hintId, errorId) || undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "bg-paper rounded-[var(--radius-sm)] px-4 py-3 text-ink placeholder:text-ink-faint",
            "shadow-[var(--shadow-recessed)] outline-none border-2 border-ink",
            "focus-visible:shadow-[var(--ring-focus)]",
            error && "outline-offset-2",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <span id={hintId} className="text-xs text-ink-faint">
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-ink">
            <WarningIcon width={12} height={12} />
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
