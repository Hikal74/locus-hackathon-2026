import type { RoadmapCategory, RoadmapTask } from "./roadmap";

/**
 * Pure presentation transform over RoadmapTask[] — no new task-generation logic
 * lives here, just a regrouping of the same deterministic tasks (buildRoadmap +
 * buildPortfolioTasks) into parallel "lines" for the metro-map visualization
 * (src/components/roadmap/MetroMap.tsx). Line membership mirrors
 * roadmap.ts's computeReadiness buckets, plus the new portfolio line.
 */

export type MetroLineId = "academic" | "portfolio" | "documents" | "applications";

export interface MetroStation {
  id: string;
  title: string;
  reason: string;
  lineId: MetroLineId;
  order: number;
}

export interface MetroLine {
  id: MetroLineId;
  label: string;
  stations: MetroStation[];
}

export interface MetroMap {
  lines: MetroLine[];
}

const LINE_DEFS: { id: MetroLineId; label: string; categories: RoadmapCategory[] }[] = [
  { id: "academic", label: "Academic Prep", categories: ["academic", "exams"] },
  { id: "portfolio", label: "Portfolio & Achievements", categories: ["portfolio"] },
  { id: "documents", label: "Documents & Funding", categories: ["documents", "scholarships"] },
  { id: "applications", label: "Applications & Essays", categories: ["applications", "essays", "recommendation_letters"] },
];

export function buildMetroMap(tasks: RoadmapTask[]): MetroMap {
  const lines: MetroLine[] = LINE_DEFS.map(({ id, label, categories }) => ({
    id,
    label,
    stations: tasks
      .filter((t) => categories.includes(t.category))
      .map((t, order) => ({ id: t.id, title: t.title, reason: t.reason, lineId: id, order })),
  }));
  return { lines };
}

export interface LineProgress {
  done: number;
  total: number;
}

export function computeLineProgress(map: MetroMap, completedIds: string[]): Record<MetroLineId, LineProgress> {
  const result = {} as Record<MetroLineId, LineProgress>;
  for (const line of map.lines) {
    const done = line.stations.filter((s) => completedIds.includes(s.id)).length;
    result[line.id] = { done, total: line.stations.length };
  }
  return result;
}

/** Every station across every line is complete — the map's "Dream Portfolio" terminus lights up. */
export function isMapComplete(map: MetroMap, completedIds: string[]): boolean {
  const allStations = map.lines.flatMap((l) => l.stations);
  return allStations.length > 0 && allStations.every((s) => completedIds.includes(s.id));
}
