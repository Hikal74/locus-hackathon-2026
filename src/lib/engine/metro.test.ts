import { describe, expect, it } from "vitest";
import { buildMetroMap, computeLineProgress, isMapComplete } from "./metro";
import type { RoadmapTask } from "./roadmap";

const tasks: RoadmapTask[] = [
  { id: "gap-0", title: "SAT not completed", category: "exams", priority: "now", reason: "" },
  { id: "documents-transcripts", title: "Transcripts", category: "documents", priority: "now", reason: "" },
  { id: "scholarships", title: "Research scholarships", category: "scholarships", priority: "next", reason: "" },
  { id: "portfolio-project", title: "Build a project", category: "portfolio", priority: "next", reason: "" },
  { id: "essays", title: "Draft essay", category: "essays", priority: "later", reason: "" },
];

describe("buildMetroMap", () => {
  it("groups tasks into the 4 lines by category", () => {
    const map = buildMetroMap(tasks);
    expect(map.lines).toHaveLength(4);
    const byId = Object.fromEntries(map.lines.map((l) => [l.id, l]));
    expect(byId.academic.stations.map((s) => s.id)).toEqual(["gap-0"]);
    expect(byId.portfolio.stations.map((s) => s.id)).toEqual(["portfolio-project"]);
    expect(byId.documents.stations.map((s) => s.id).sort()).toEqual(["documents-transcripts", "scholarships"]);
    expect(byId.applications.stations.map((s) => s.id)).toEqual(["essays"]);
  });

  it("returns empty lines gracefully for an empty task list", () => {
    const map = buildMetroMap([]);
    expect(map.lines.every((l) => l.stations.length === 0)).toBe(true);
  });
});

describe("computeLineProgress", () => {
  it("reports accurate done/total per line", () => {
    const map = buildMetroMap(tasks);
    const progress = computeLineProgress(map, ["documents-transcripts"]);
    expect(progress.documents).toEqual({ done: 1, total: 2 });
    expect(progress.portfolio).toEqual({ done: 0, total: 1 });
  });
});

describe("isMapComplete", () => {
  it("is false when nothing is complete", () => {
    const map = buildMetroMap(tasks);
    expect(isMapComplete(map, [])).toBe(false);
  });

  it("is false for an empty map (nothing to complete)", () => {
    const map = buildMetroMap([]);
    expect(isMapComplete(map, [])).toBe(false);
  });

  it("is true once every station across every line is complete", () => {
    const map = buildMetroMap(tasks);
    const allIds = map.lines.flatMap((l) => l.stations.map((s) => s.id));
    expect(isMapComplete(map, allIds)).toBe(true);
  });
});
