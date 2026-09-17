import { describe, expect, it } from "vitest";
import { buildDiagnosis } from "./diagnosis";
import { testProfile } from "./test-fixtures";

describe("buildDiagnosis", () => {
  it("lists a GPA strength when GPA is provided and competitive", () => {
    const diagnosis = buildDiagnosis({ ...testProfile, gpaOn4Scale: 3.9 });
    expect(diagnosis.strengths.some((s) => /GPA/.test(s))).toBe(true);
    expect(diagnosis.gaps.some((g) => /GPA/.test(g))).toBe(false);
  });

  it("flags missing GPA as a gap, not a strength", () => {
    const diagnosis = buildDiagnosis({ ...testProfile, gpaOn4Scale: undefined });
    expect(diagnosis.gaps.some((g) => /GPA/.test(g))).toBe(true);
  });

  it("flags no interests selected as a gap", () => {
    const diagnosis = buildDiagnosis({ ...testProfile, interests: [] });
    expect(diagnosis.gaps.some((g) => /interest/i.test(g))).toBe(true);
  });

  it("flags a single-country shortlist as a constraint", () => {
    const diagnosis = buildDiagnosis({ ...testProfile, countryPreferences: ["USA"] });
    expect(diagnosis.constraints.some((c) => /narrows/i.test(c))).toBe(true);
  });

  it("computes overall readiness as the average of its three components", () => {
    const diagnosis = buildDiagnosis(testProfile);
    const expectedAverage = Math.round(
      diagnosis.readiness.reduce((sum, r) => sum + r.value, 0) / diagnosis.readiness.length
    );
    expect(diagnosis.overallReadiness).toBe(expectedAverage);
  });

  it("never frames readiness as an admission probability in the goal sentence", () => {
    const diagnosis = buildDiagnosis(testProfile);
    expect(diagnosis.goal).not.toMatch(/chance|probability|admit/i);
  });
});
