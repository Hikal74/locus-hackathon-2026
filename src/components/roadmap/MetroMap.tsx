"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MetroLineId, MetroMap as MetroMapData, MetroStation } from "@/lib/engine/metro";
import { computeLineProgress, isMapComplete } from "@/lib/engine/metro";
import { cn } from "@/lib/utils/cn";

interface MetroMapProps {
  map: MetroMapData;
  completedIds: string[];
  onToggle: (stationId: string) => void;
}

const ROW_HEIGHT = 84;
const PAD_TOP = 32;
const PAD_BOTTOM = 32;
const LABEL_WIDTH = 200;
const RAIL_START_X = LABEL_WIDTH + 20;
const STATION_GAP = 78;
const TRUNK_MARGIN = 40;
const DIAGONAL_RUN = 70;
const TERMINUS_LABEL_SPACE = 130;

/** Lines are distinguished by stroke pattern, not color — consistent with this app's monochrome design system. */
const LINE_DASH: Record<MetroLineId, string | undefined> = {
  academic: undefined, // solid
  portfolio: "10 6",
  documents: "1.5 6",
  applications: "10 4 2 4",
};

function StationDot({ cx, cy, done, selected }: { cx: number; cy: number; done: boolean; selected: boolean }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={14} fill="transparent" />
      <circle cx={cx} cy={cy} r={selected ? 9 : 7} fill="var(--color-paper)" />
      <circle
        cx={cx}
        cy={cy}
        r={selected ? 7 : 5.5}
        fill={done ? "var(--color-ink)" : "var(--color-paper)"}
        stroke="var(--color-ink)"
        strokeWidth={2}
      />
    </>
  );
}

export function MetroMap({ map, completedIds, onToggle }: MetroMapProps) {
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
      <div className="overflow-x-auto">
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
            const lineProgress = progress[line.id];
            return (
              <g key={line.id}>
                <text x={4} y={y - 10} className="fill-ink text-[13px] font-semibold">
                  {line.label}
                </text>
                <text x={4} y={y + 8} className="fill-ink-faint text-[11px]">
                  {lineProgress.done}/{lineProgress.total} done
                </text>

                <line x1={RAIL_START_X} y1={y} x2={trunkX} y2={y} stroke="var(--color-ink)" strokeWidth={3} strokeDasharray={dash} />
                <line
                  x1={trunkX}
                  y1={y}
                  x2={terminusX}
                  y2={terminusY}
                  stroke="var(--color-ink)"
                  strokeWidth={3}
                  strokeDasharray={dash}
                  opacity={0.6}
                />

                {line.stations.map((station, i) => {
                  const cx = RAIL_START_X + i * STATION_GAP;
                  const done = completedIds.includes(station.id);
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
                      <StationDot cx={cx} cy={y} done={done} selected={selectedId === station.id} />
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
            <circle cx={terminusX} cy={terminusY} r={20} fill="transparent" />
            <circle
              cx={terminusX}
              cy={terminusY}
              r={selectedIsTerminus ? 13 : 11}
              fill={complete ? "var(--color-ink)" : "var(--color-paper)"}
              stroke="var(--color-ink)"
              strokeWidth={3}
            />
            <text x={terminusX + 22} y={terminusY - 4} className="fill-ink text-[13px] font-semibold">
              Dream Portfolio
            </text>
            <text x={terminusX + 22} y={terminusY + 13} className="fill-ink-faint text-[11px]">
              {map.lines.reduce((n, l) => n + progress[l.id].done, 0)}/{map.lines.reduce((n, l) => n + progress[l.id].total, 0)} overall
            </text>
          </g>
        </svg>
      </div>

      <Card padding="sm">
        {selectedStation && (
          <div className="flex flex-col gap-3">
            <div>
              <p className={cn("font-semibold text-ink", completedIds.includes(selectedStation.id) && "line-through text-ink-faint")}>
                {selectedStation.title}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{selectedStation.reason}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onToggle(selectedStation.id)} className="self-start">
              {completedIds.includes(selectedStation.id) ? "Mark as not done" : "Mark as done"}
            </Button>
          </div>
        )}
        {selectedIsTerminus && (
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">Dream Portfolio</p>
            <p className="text-sm text-ink-soft">
              {complete
                ? "Every station on every line is checked off — this is what a fully-built application looks like."
                : "Where all four tracks lead. Check off stations on each line above to fill it in."}
            </p>
          </div>
        )}
        {!selectedStation && !selectedIsTerminus && (
          <p className="text-sm text-ink-faint">Click or tab to a station to see details.</p>
        )}
      </Card>
    </div>
  );
}
