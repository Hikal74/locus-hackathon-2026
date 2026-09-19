import { cn } from "@/lib/utils/cn";

interface ProgressProps {
  label: string;
  value: number; // 0-100
  tone?: "primary" | "accent" | "success" | "warning";
  className?: string;
}

/**
 * Readiness/progress bar. Never frame this as an admission probability — see
 * docs/DATA_AND_TRUST.md. Tone is kept for API compatibility but only
 * changes the fill pattern (solid vs. hatched), never a hue.
 */
export function Progress({ label, value, tone = "primary", className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const hatched = tone === "warning";
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft font-medium">{label}</span>
        <span className="text-ink-faint">{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-3 rounded-[var(--radius-pill)] bg-surface border border-line-soft overflow-hidden"
      >
        <div
          className={cn(
            "h-full rounded-[var(--radius-pill)] bg-ink transition-[width] duration-500 ease-out",
            hatched && "pattern-hatch"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
