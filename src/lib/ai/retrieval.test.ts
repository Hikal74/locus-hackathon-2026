import { describe, expect, it } from "vitest";
import { retrieveContext, retrievedProgramIds } from "./retrieval";
import { universities, programs } from "@/lib/data/dataset";
import { testProfile } from "@/lib/engine/test-fixtures";
import type { StudentProfile } from "@/lib/data/types";

describe("retrieveContext", () => {
  it("returns only records the deterministic engine would also match, capped well below the full dataset", () => {
    const context = retrieveContext(testProfile, universities, programs);

    expect(context.matched.length).toBeGreaterThan(0);
    expect(context.matched.length).toBeLessThanOrEqual(8);
    expect(context.matched.length).toBeLessThan(programs.length);
    for (const m of context.matched) {
      expect(m.program.field).toBe(testProfile.intendedField);
      expect(testProfile.countryPreferences).toContain(m.university.country);
    }
  });

  it("ranks matched records by fit score, descending", () => {
    const context = retrieveContext(testProfile, universities, programs);
    for (let i = 1; i < context.matched.length; i++) {
      expect(context.matched[i - 1].fitScore).toBeGreaterThanOrEqual(context.matched[i].fitScore);
    }
  });

  it("returns an empty matched list (not a throw) when nothing satisfies the hard constraints", () => {
    const impossible: StudentProfile = {
      ...testProfile,
      intendedField: "medicine", // no medicine programs exist in the dataset
    };
    const context = retrieveContext(impossible, universities, programs);
    expect(context.matched).toEqual([]);
    expect(context.totalMatchedInDataset).toBe(0);
  });

  it("caps the excluded sample independently of how many programs were actually excluded", () => {
    const broad: StudentProfile = {
      ...testProfile,
      countryPreferences: ["USA"],
      budgetPerYearUSD: 1, // forces most/all USA programs into the excluded set on budget
    };
    const context = retrieveContext(broad, universities, programs);
    expect(context.excludedSample.length).toBeLessThanOrEqual(4);
    expect(context.excludedSample.length).toBeLessThanOrEqual(context.totalExcludedInDataset);
  });

  it("never lets a program appear as both matched and excluded", () => {
    const context = retrieveContext(testProfile, universities, programs);
    const matchedIds = new Set(context.matched.map((m) => m.program.id));
    for (const ex of context.excludedSample) {
      expect(matchedIds.has(ex.program.id)).toBe(false);
    }
  });
});

describe("retrievedProgramIds", () => {
  it("is the union of matched and excluded-sample program ids", () => {
    const context = retrieveContext(testProfile, universities, programs);
    const ids = retrievedProgramIds(context);
    expect(ids.length).toBe(context.matched.length + context.excludedSample.length);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });
});
