import { cn } from "@/lib/utils/cn";

/** Three-dot level meter. `filled` null renders the "not enough info" pill. Monochrome: fill vs. outline, never hue. */
export function DotMeter({ filled, total = 3 }: { filled: number | null; total?: number }) {
  if (filled === null) {
    return (
      <span className="rounded-[var(--radius-pill)] border border-dotted border-ink-faint px-2 py-0.5 text-xs text-ink-faint">
        Not enough info
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cn("h-2.5 w-2.5 rounded-full border border-ink", i < filled && "bg-ink")} />
      ))}
    </span>
  );
}
