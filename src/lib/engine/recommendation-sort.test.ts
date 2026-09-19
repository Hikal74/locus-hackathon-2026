import { describe, expect, it } from "vitest";
import { sortRecommendations } from "./recommendation-sort";
import { testProgram, testUniversity } from "./test-fixtures";
import type { Recommendation } from "./types";

const rec = (id: string, fitScore: number, tuition: number, dates: string[]): Recommendation => ({
  program: {
    ...testProgram,
    id,
    tuitionPerYearUSD: { value: tuition, status: "verified" },
    deadlines: dates.map((date) => ({ label: "Regular", date })),
  },
  university: testUniversity,
  fitScore,
  factors: [],
  whyItFits: [],
  watchOut: [],
});

const ids = (recs: Recommendation[]) => recs.map((r) => r.program.id);

describe("sortRecommendations", () => {
  const a = rec("a", 70, 20000, ["2027-03-01"]);
  const b = rec("b", 90, 5000, ["2027-01-01"]);
  const c = rec("c", 80, 5000, []);

  it("sorts by fit, highest first", () => {
    expect(ids(sortRecommendations([a, b, c], "fit"))).toEqual(["b", "c", "a"]);
  });

  it("sorts by tuition, lowest first, breaking ties by fit", () => {
    expect(ids(sortRecommendations([a, c, b], "tuition"))).toEqual(["b", "c", "a"]);
  });

  it("sorts by nearest deadline and puts programs with no deadline last", () => {
    expect(ids(sortRecommendations([a, b, c], "deadline"))).toEqual(["b", "a", "c"]);
  });

  it("ignores deadlines that have already passed when given today's date", () => {
    const early = rec("early", 60, 1, ["2026-08-01", "2027-06-01"]);
    const mid = rec("mid", 60, 1, ["2027-02-01"]);
    expect(ids(sortRecommendations([early, mid], "deadline", "2026-09-19"))).toEqual(["mid", "early"]);
  });

  it("treats a program whose deadlines have all passed like one with none", () => {
    const passedOnly = rec("passed", 99, 1, ["2026-01-01"]);
    expect(ids(sortRecommendations([passedOnly, a], "deadline", "2026-09-19"))).toEqual(["a", "passed"]);
  });

  it("returns a new array without mutating the input", () => {
    const input = [a, b, c];
    const sorted = sortRecommendations(input, "fit");
    expect(sorted).not.toBe(input);
    expect(ids(input)).toEqual(["a", "b", "c"]);
  });
});
