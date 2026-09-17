import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface ClayTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Recessed clay textarea — same visual language as ClayInput, for free-text answers. */
export const ClayTextarea = forwardRef<HTMLTextAreaElement, ClayTextareaProps>(
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
        <textarea
          ref={ref}
          id={inputId}
          aria-describedby={cn(hintId, errorId) || undefined}
          aria-invalid={Boolean(error)}
          className={cn(
            "bg-surface rounded-[var(--radius-sm)] px-4 py-3 text-ink placeholder:text-ink-faint",
            "shadow-[var(--shadow-clay-recessed)] outline-none border border-transparent resize-y",
            "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/30",
            error && "focus-visible:ring-danger/40",
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
          <span id={errorId} className="text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    );
  }
);
ClayTextarea.displayName = "ClayTextarea";
