import type { VerificationStatus } from "@/lib/data/types";
import { VerificationBadge } from "@/components/ui/Badge";

export interface StatBarEntry {
  id: string;
  name: string;
  value: number;
  displayValue: string;
  verification?: VerificationStatus;
}

interface StatBarChartProps {
  label: string;
  entries: StatBarEntry[];
  maxValue: number;
}

const BAR_HEIGHT = 20;
const ROW_GAP = 14;
const PAD_LEFT = 4;
const PAD_RIGHT = 8;
const LABEL_ROW_HEIGHT = 18;
const CHART_WIDTH = 420;
const TRACK_WIDTH = CHART_WIDTH - PAD_LEFT - PAD_RIGHT - 60; // leave room for the value label at the end

/**
 * Fill pattern per compared entity (max 3) — never color, per this app's
 * monochrome design system. index 0 = solid, 1 = diagonal hatch (SVG pattern,
 * same visual family as globals.css's .pattern-hatch), 2 = outline-only.
 */
function barFill(index: number): string {
  if (index === 0) return "var(--color-ink)";
  if (index === 1) return "url(#compare-hatch)";
  return "var(--color-paper)";
}

/** Small shared swatch legend for up to 3 entities — rendered once above a group of stat charts. */
export function StatLegend({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {names.map((name, i) => (
        <div key={name} className="flex items-center gap-2 text-sm text-ink-soft">
          <svg width="16" height="16" aria-hidden="true">
            <rect x={0} y={0} width={16} height={16} rx={3} fill={barFill(i)} stroke="var(--color-ink)" strokeWidth={2} />
          </svg>
          {name}
        </div>
      ))}
    </div>
  );
}

export function StatBarChart({ label, entries, maxValue }: StatBarChartProps) {
  const height = LABEL_ROW_HEIGHT + entries.length * (BAR_HEIGHT + ROW_GAP);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} role="img" aria-label={`${label} comparison`} className="mt-2 w-full max-w-[420px]">
        <defs>
          <pattern id="compare-hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width={6} height={6} fill="var(--color-paper)" />
            <line x1={0} y1={0} x2={0} y2={6} stroke="var(--color-ink)" strokeWidth={2} />
          </pattern>
        </defs>
        {entries.map((entry, i) => {
          const y = LABEL_ROW_HEIGHT + i * (BAR_HEIGHT + ROW_GAP);
          const barLength = maxValue > 0 ? Math.max(2, (entry.value / maxValue) * TRACK_WIDTH) : 0;
          return (
            <g key={entry.id}>
              <text x={PAD_LEFT} y={y - 4} className="fill-ink-soft text-[11px]">
                {entry.name}
              </text>
              <rect x={PAD_LEFT} y={y} width={TRACK_WIDTH} height={BAR_HEIGHT} rx={4} fill="var(--color-surface)" />
              <rect
                x={PAD_LEFT}
                y={y}
                width={barLength}
                height={BAR_HEIGHT}
                rx={4}
                fill={barFill(i)}
                stroke="var(--color-ink)"
                strokeWidth={2}
              />
              <text
                x={PAD_LEFT + barLength + 8}
                y={y + BAR_HEIGHT / 2 + 4}
                className="fill-ink text-[11px] font-medium"
              >
                {entry.displayValue}
              </text>
            </g>
          );
        })}
      </svg>
      {entries.some((e) => e.verification) && (
        <div className="mt-1 flex flex-wrap gap-2">
          {entries.map(
            (e) =>
              e.verification && (
                <VerificationBadge key={e.id} status={e.verification} />
              )
          )}
        </div>
      )}
    </div>
  );
}
