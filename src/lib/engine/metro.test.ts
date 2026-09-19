import { describe, expect, it } from "vitest";
import { buildMetroMap, computeLineProgress, findNextMicrotask, isMapComplete, isStationDone, wrapStationLabel } from "./metro";
import type { RoadmapTask } from "./roadmap";

const tasks: RoadmapTask[] = [
  { id: "gap-0", title: "SAT not completed", category: "exams", priority: "now", reason: "" },
  { id: "documents-transcripts", title: "Transcripts", category: "documents", priority: "now", reason: "", microtasks: ["Request", "Certify"] },
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

  it("falls back to a single microtask matching the station title when the task provides none", () => {
    const map = buildMetroMap(tasks);
    const scholarshipsStation = map.lines.flatMap((l) => l.stations).find((s) => s.id === "scholarships");
    expect(scholarshipsStation?.microtasks).toEqual([{ id: "scholarships::0", title: "Research scholarships" }]);
  });

  it("expands an explicit microtasks array into ordered, id-suffixed steps", () => {
    const map = buildMetroMap(tasks);
    const docsStation = map.lines.flatMap((l) => l.stations).find((s) => s.id === "documents-transcripts");
    expect(docsStation?.microtasks).toEqual([
      { id: "documents-transcripts::0", title: "Request" },
      { id: "documents-transcripts::1", title: "Certify" },
    ]);
  });
});

describe("isStationDone", () => {
  it("is false until every microtask is complete", () => {
    const map = buildMetroMap(tasks);
    const docsStation = map.lines.flatMap((l) => l.stations).find((s) => s.id === "documents-transcripts")!;
    expect(isStationDone(docsStation, ["documents-transcripts::0"])).toBe(false);
    expect(isStationDone(docsStation, ["documents-transcripts::0", "documents-transcripts::1"])).toBe(true);
  });
});

describe("computeLineProgress", () => {
  it("reports accurate done/total per line, counting a station done only once all its microtasks are", () => {
    const map = buildMetroMap(tasks);
    const progress = computeLineProgress(map, ["documents-transcripts::0", "documents-transcripts::1"]);
    expect(progress.documents).toEqual({ done: 1, total: 2 });
    expect(progress.portfolio).toEqual({ done: 0, total: 1 });
  });

  it("does not count a station as done when only some of its microtasks are checked", () => {
    const map = buildMetroMap(tasks);
    const progress = computeLineProgress(map, ["documents-transcripts::0"]);
    expect(progress.documents.done).toBe(0);
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

  it("is true once every microtask across every line is complete", () => {
    const map = buildMetroMap(tasks);
    const allMicrotaskIds = map.lines.flatMap((l) => l.stations.flatMap((s) => s.microtasks.map((m) => m.id)));
    expect(isMapComplete(map, allMicrotaskIds)).toBe(true);
  });
});

describe("findNextMicrotask", () => {
  it("returns null for an empty map", () => {
    expect(findNextMicrotask(buildMetroMap([]), [])).toBeNull();
  });

  it("returns the first incomplete microtask in line/station/step order", () => {
    const map = buildMetroMap(tasks);
    const next = findNextMicrotask(map, []);
    expect(next?.station.id).toBe("gap-0");
  });

  it("skips completed microtasks and stations", () => {
    const map = buildMetroMap(tasks);
    const allInAcademicLine = map.lines.find((l) => l.id === "academic")!.stations.flatMap((s) => s.microtasks.map((m) => m.id));
    const next = findNextMicrotask(map, allInAcademicLine);
    expect(next?.station.id).not.toBe("gap-0");
  });
});

describe("wrapStationLabel", () => {
  it("keeps a short title on one line", () => {
    expect(wrapStationLabel("Take the test")).toEqual(["Take the", "test"]);
    expect(wrapStationLabel("Register")).toEqual(["Register"]);
  });

  it("wraps on word boundaries without exceeding the line width", () => {
    const lines = wrapStationLabel("Gather official transcripts", 12, 2);
    expect(lines).toEqual(["Gather", "official…"]);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(12);
  });

  it("ends the last line with an ellipsis when the title is too long", () => {
    const lines = wrapStationLabel("Submit application to Nazarbayev University", 12, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(12);
  });

  it("clips a single word longer than the line", () => {
    const lines = wrapStationLabel("Internationalization", 12, 2);
    expect(lines).toEqual(["Internation…"]);
  });

  it("never returns more lines than allowed, and returns nothing for an empty title", () => {
    expect(wrapStationLabel("a b c d e f g h i j k l m n o p", 4, 2).length).toBeLessThanOrEqual(2);
    expect(wrapStationLabel("   ")).toEqual([]);
  });
});
