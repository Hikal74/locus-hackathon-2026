import { TextareaHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";
import { WarningIcon } from "./icons";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Same recessed visual language as Input, for free-text answers. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
            "outline-none border border-line resize-y",
            "focus-visible:shadow-[var(--ring-focus)] focus-visible:border-ink",
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
Textarea.displayName = "Textarea";
