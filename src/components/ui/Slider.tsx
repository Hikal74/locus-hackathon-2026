import { InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  valueLabel?: string;
}

/**
 * Native range input restyled as a black rail with a square black thumb —
 * no color, no library. Used for the Fit Map's live weight controls.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ label, valueLabel, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor={inputId} className="font-medium text-ink-soft">
            {label}
          </label>
          {valueLabel && <span className="text-ink-faint tabular-nums">{valueLabel}</span>}
        </div>
        <input
          ref={ref}
          id={inputId}
          type="range"
          className={cn(
            "w-full appearance-none h-2 rounded-[var(--radius-pill)] bg-surface border border-ink cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:rounded-[3px] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink",
            "[&::-webkit-slider-thumb]:shadow-[var(--shadow-raised)] [&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:rounded-[3px] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:cursor-pointer",
            "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";
