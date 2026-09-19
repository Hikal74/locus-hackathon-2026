"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";
import type { MetroLineId, MetroMap as MetroMapData, MetroStation } from "@/lib/engine/metro";
import { computeLineProgress, isMapComplete, isStationDone, wrapStationLabel } from "@/lib/engine/metro";
import { cn } from "@/lib/utils/cn";

interface MetroMapProps {
  map: MetroMapData;
  completedIds: string[];
  onToggleMicrotask: (microtaskId: string) => void;
}

const ROW_HEIGHT = 84;
const PAD_TOP = 32;
const PAD_BOTTOM = 46;
const LABEL_WIDTH = 200;
const RAIL_START_X = LABEL_WIDTH + 20;
const STATION_GAP = 78;
const TRUNK_MARGIN = 40;
const DIAGONAL_RUN = 70;
const TERMINUS_LABEL_SPACE = 130;

/**
 * Vivid per-line colors, reused from the homepage's decorative Pathway Metro
 * illustration (now retired — this is the real, data-driven version of that
 * same look). Dash pattern is kept alongside color, not replaced by it, so
 * the lines still read apart under color-blindness or on a printout.
 */
const LINE_COLOR: Record<MetroLineId, string> = {
  academic: "#4C8DFF",
  portfolio: "#FF5C46",
  documents: "#4CC26A",
  applications: "#FF9645",
};

const LINE_DASH: Record<MetroLineId, string | undefined> = {
  academic: undefined, // solid
  portfolio: "10 6",
  documents: "1.5 6",
  applications: "10 4 2 4",
};

const TERMINUS_GOLD = "#F0B400";

function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return points.join(" ");
}

function StationDot({ cx, cy, color, done, selected }: { cx: number; cy: number; color: string; done: boolean; selected: boolean }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={16} fill="transparent" />
      <circle cx={cx} cy={cy} r={selected ? 11 : 8} fill="var(--color-paper)" />
      <circle cx={cx} cy={cy} r={selected ? 8 : 6} fill={done ? color : "var(--color-paper)"} stroke={color} strokeWidth={2.5} />
    </>
  );
}

export function MetroMap({ map, completedIds, onToggleMicrotask }: MetroMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const progress = useMemo(() => computeLineProgress(map, completedIds), [map, completedIds]);
  const complete = isMapComplete(map, completedIds);

  const maxStations = Math.max(1, ...map.lines.map((l) => l.stations.length));
  const trunkX = RAIL_START_X + maxStations * STATION_GAP + TRUNK_MARGIN;
  const terminusX = trunkX + DIAGONAL_RUN;
  const width = terminusX + TERMINUS_LABEL_SPACE;
  const height = PAD_TOP + (map.lines.length - 1) * ROW_HEIGHT + PAD_BOTTOM;
  const terminusY = PAD_TOP + ((map.lines.length - 1) / 2) * ROW_HEIGHT;

  const allStationsById = useMemo(() => {
    const byId = new Map<string, MetroStation>();
    for (const line of map.lines) for (const s of line.stations) byId.set(s.id, s);
    return byId;
  }, [map]);

  const selectedStation = selectedId && selectedId !== "terminus" ? allStationsById.get(selectedId) ?? null : null;
  const selectedIsTerminus = selectedId === "terminus";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {map.lines.map((line) => (
          <div key={line.id} className="flex items-center gap-2">
            <span className="h-2 w-7 shrink-0 rounded-full" style={{ backgroundColor: LINE_COLOR[line.id] }} />
            <span className="text-sm font-medium text-ink-soft">{line.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line-soft bg-surface p-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Your path to a dream portfolio, as four parallel tracks"
          className="min-w-[640px] w-full"
          style={{ minWidth: Math.min(width, 900) }}
        >
          {map.lines.map((line, rowIndex) => {
            const y = PAD_TOP + rowIndex * ROW_HEIGHT;
            const dash = LINE_DASH[line.id];
            const color = LINE_COLOR[line.id];
            const lineProgress = progress[line.id];
            return (
              <g key={line.id}>
                <text x={4} y={y - 10} className="text-[13px] font-semibold" fill={color}>
                  {line.label}
                </text>
                <text x={4} y={y + 8} className="fill-ink-faint text-[11px]">
                  {lineProgress.done}/{lineProgress.total} done
                </text>

                <path
                  d={`M ${RAIL_START_X} ${y} L ${trunkX} ${y} L ${terminusX} ${terminusY}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={dash}
                />

                {line.stations.map((station, i) => {
                  const cx = RAIL_START_X + i * STATION_GAP;
                  const done = isStationDone(station, completedIds);
                  const labelLines = wrapStationLabel(station.title);
                  return (
                    <g
                      key={station.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`${station.title}${done ? " — done" : ""}`}
                      onClick={() => setSelectedId(station.id)}
                      onFocus={() => setSelectedId(station.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedId(station.id);
                      }}
                      className="cursor-pointer outline-none"
                    >
                      <title>{station.title}</title>
                      <StationDot cx={cx} cy={y} color={color} done={done} selected={selectedId === station.id} />
                      <text
                        x={cx}
                        y={y + 28}
                        textAnchor="middle"
                        className={cn("text-[9.5px]", selectedId === station.id ? "font-semibold" : "font-medium")}
                        fill={selectedId === station.id ? color : "var(--color-ink-faint)"}
                      >
                        {labelLines.map((line, lineIndex) => (
                          <tspan key={lineIndex} x={cx} dy={lineIndex === 0 ? 0 : 11}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          <g
            tabIndex={0}
            role="button"
            aria-label={`Dream Portfolio — ${complete ? "complete" : "in progress"}`}
            onClick={() => setSelectedId("terminus")}
            onFocus={() => setSelectedId("terminus")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSelectedId("terminus");
            }}
            className="cursor-pointer outline-none"
          >
            <circle cx={terminusX} cy={terminusY} r={24} fill="transparent" />
            <polygon
              points={starPoints(terminusX, terminusY, selectedIsTerminus ? 18 : 15, selectedIsTerminus ? 8 : 6.5)}
              fill={complete ? TERMINUS_GOLD : "var(--color-paper)"}
              stroke={TERMINUS_GOLD}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            <text x={terminusX + 26} y={terminusY - 4} className="fill-ink text-[13px] font-semibold">
              Dream Portfolio
            </text>
            <text x={terminusX + 26} y={terminusY + 13} className="fill-ink-faint text-[11px]">
              {map.lines.reduce((n, l) => n + progress[l.id].done, 0)}/{map.lines.reduce((n, l) => n + progress[l.id].total, 0)} overall
            </text>
          </g>
        </svg>
      </div>

      <Card padding="sm">
        {selectedStation && (
          <div className="flex flex-col gap-3">
            <div>
              <p className={cn("font-semibold text-ink", isStationDone(selectedStation, completedIds) && "line-through text-ink-faint")}>
                {selectedStation.title}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{selectedStation.reason}</p>
            </div>
            {selectedStation.microtasks.length > 1 && (
              <ul className="flex flex-col gap-1.5">
                {selectedStation.microtasks.map((m) => {
                  const done = completedIds.includes(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => onToggleMicrotask(m.id)}
                        className="flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm hover:bg-surface"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-ink",
                            done && "bg-ink"
                          )}
                        >
                          {done && <CheckIcon width={10} height={10} className="text-on-primary" />}
                        </span>
                        <span className={cn("text-ink-soft", done && "line-through text-ink-faint")}>{m.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {selectedStation.microtasks.length === 1 && (
              <button
                type="button"
                onClick={() => onToggleMicrotask(selectedStation.microtasks[0].id)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] border-2 border-ink px-3 py-2 text-sm font-medium hover:bg-surface self-start"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 border-ink",
                    completedIds.includes(selectedStation.microtasks[0].id) && "bg-ink"
                  )}
                >
                  {completedIds.includes(selectedStation.microtasks[0].id) && <CheckIcon width={10} height={10} className="text-on-primary" />}
                </span>
                {completedIds.includes(selectedStation.microtasks[0].id) ? "Marked as done" : "Mark as done"}
              </button>
            )}
          </div>
        )}
        {selectedIsTerminus && (
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">Dream Portfolio</p>
            <p className="text-sm text-ink-soft">
              {complete
                ? "Every station on every line is checked off — this is what a fully-built application looks like."
                : "Where all four tracks lead. Check off the steps inside each station above to fill it in."}
            </p>
          </div>
        )}
        {!selectedStation && !selectedIsTerminus && (
          <p className="text-sm text-ink-faint">Click or tab to a station to see its steps.</p>
        )}
      </Card>
    </div>
  );
}
