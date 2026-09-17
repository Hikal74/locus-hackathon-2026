import { cn } from "@/lib/utils/cn";

interface ClayProgressProps {
  label: string;
  value: number; // 0-100
  tone?: "primary" | "accent" | "success" | "warning";
  className?: string;
}

const toneClasses = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
};

/** Readiness/progress bar. Never frame this as an admission probability — see docs/DATA_AND_TRUST.md. */
export function ClayProgress({ label, value, tone = "primary", className }: ClayProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
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
        className="h-3 rounded-[var(--radius-pill)] bg-base shadow-[var(--shadow-clay-recessed)] overflow-hidden"
      >
        <div
          className={cn("h-full rounded-[var(--radius-pill)] transition-[width] duration-500 ease-out", toneClasses[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
