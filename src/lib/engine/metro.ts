import type { RoadmapCategory, RoadmapTask } from "./roadmap";

/**
 * Pure presentation transform over RoadmapTask[] — no new task-generation logic
 * lives here, just a regrouping of the same deterministic tasks (buildRoadmap +
 * buildPortfolioTasks) into parallel "lines" for the metro-map visualization
 * (src/components/roadmap/MetroMap.tsx). Line membership mirrors
 * roadmap.ts's computeReadiness buckets, plus the new portfolio line.
 */

export type MetroLineId = "academic" | "portfolio" | "documents" | "applications";

export interface Microtask {
  id: string;
  title: string;
}

export interface MetroStation {
  id: string;
  title: string;
  reason: string;
  lineId: MetroLineId;
  order: number;
  /** Always non-empty — a task with no explicit breakdown falls back to a single microtask matching its own title. */
  microtasks: Microtask[];
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
      .map((t, order) => ({
        id: t.id,
        title: t.title,
        reason: t.reason,
        lineId: id,
        order,
        microtasks: (t.microtasks && t.microtasks.length > 0 ? t.microtasks : [t.title]).map((title, i) => ({
          id: `${t.id}::${i}`,
          title,
        })),
      })),
  }));
  return { lines };
}

/** A station is done once every one of its microtasks is checked off. */
export function isStationDone(station: MetroStation, completedIds: string[]): boolean {
  return station.microtasks.every((m) => completedIds.includes(m.id));
}

export interface LineProgress {
  done: number;
  total: number;
}

export function computeLineProgress(map: MetroMap, completedIds: string[]): Record<MetroLineId, LineProgress> {
  const result = {} as Record<MetroLineId, LineProgress>;
  for (const line of map.lines) {
    const done = line.stations.filter((s) => isStationDone(s, completedIds)).length;
    result[line.id] = { done, total: line.stations.length };
  }
  return result;
}

/** Every station across every line is complete — the map's "Dream Portfolio" terminus lights up. */
export function isMapComplete(map: MetroMap, completedIds: string[]): boolean {
  const allStations = map.lines.flatMap((l) => l.stations);
  return allStations.length > 0 && allStations.every((s) => isStationDone(s, completedIds));
}

/**
 * The single next concrete thing to do — the first incomplete microtask, in
 * line then station then step order. This is what "know what to do right now"
 * concretely means: one specific action, not a whole station.
 */
export function findNextMicrotask(map: MetroMap, completedIds: string[]): { station: MetroStation; microtask: Microtask } | null {
  for (const line of map.lines) {
    for (const station of line.stations) {
      for (const microtask of station.microtasks) {
        if (!completedIds.includes(microtask.id)) {
          return { station, microtask };
        }
      }
    }
  }
  return null;
}

/**
 * Wraps a station title into at most `maxLines` short lines for the map's SVG labels (SVG text doesn't wrap
 * itself, and stations sit only ~78px apart). Words are kept whole where possible; whatever doesn't fit ends
 * in an ellipsis — the full title stays available via the tooltip and aria-label.
 */
export function wrapStationLabel(title: string, maxChars = 12, maxLines = 2): string[] {
  const clip = (word: string) => (word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word);
  const ellipsize = (text: string) => (text.length + 1 <= maxChars ? `${text}…` : `${text.slice(0, maxChars - 1)}…`);

  const words = title.trim().split(/\s+/).filter(Boolean).map(clip);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (lines.length + 1 >= maxLines) return [...lines, ellipsize(current)];
    lines.push(current);
    current = word;
  }
  return current ? [...lines, current] : lines;
}
