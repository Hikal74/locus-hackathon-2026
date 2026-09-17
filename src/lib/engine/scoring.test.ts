import { describe, expect, it } from "vitest";
import { academicFit, budgetFit, interestFit, locationFit, preferencesFit, requirementsFit } from "./scoring";
import { testProfile, testProgram, testUniversity } from "./test-fixtures";

describe("academicFit", () => {
  it("scores 100 when GPA comfortably clears the minimum", () => {
    expect(academicFit({ ...testProfile, gpaOn4Scale: 3.9 }, testProgram)).toBe(100);
  });
  it("scores lower the further GPA falls below the minimum", () => {
    const atMin = academicFit({ ...testProfile, gpaOn4Scale: 3.5 }, testProgram);
    const wellBelow = academicFit({ ...testProfile, gpaOn4Scale: 2.8 }, testProgram);
    expect(atMin).toBeGreaterThan(wellBelow);
  });
  it("stays neutral (60) when GPA or the program minimum is unknown", () => {
    expect(academicFit({ ...testProfile, gpaOn4Scale: undefined }, testProgram)).toBe(60);
    expect(academicFit(testProfile, { ...testProgram, minGpaOn4Scale: undefined })).toBe(60);
  });
});

describe("interestFit", () => {
  it("scores 100 on full overlap with the program's tags", () => {
    expect(interestFit({ ...testProfile, interests: ["AI", "research"] }, testProgram)).toBe(100);
  });
  it("stays neutral (55) when the student listed no interests", () => {
    expect(interestFit({ ...testProfile, interests: [] }, testProgram)).toBe(55);
  });
  it("floors at 30 rather than 0 on zero overlap", () => {
    expect(interestFit({ ...testProfile, interests: ["underwater basket weaving"] }, testProgram)).toBe(30);
  });
});

describe("locationFit", () => {
  it("rewards a first-choice country the most", () => {
    const first = locationFit({ ...testProfile, countryPreferences: ["USA", "China"] }, testUniversity);
    const second = locationFit({ ...testProfile, countryPreferences: ["China", "USA"] }, testUniversity);
    expect(first).toBeGreaterThan(second);
  });
  it("scores 0 for a country not in the student's preferences", () => {
    expect(locationFit({ ...testProfile, countryPreferences: ["China"] }, testUniversity)).toBe(0);
  });
});

describe("budgetFit", () => {
  it("scores high when tuition sits comfortably under budget", () => {
    expect(budgetFit({ ...testProfile, budgetPerYearUSD: 40000 }, testProgram)).toBeGreaterThanOrEqual(90);
  });
  it("scores lower the further tuition exceeds budget", () => {
    const overBudget = budgetFit({ ...testProfile, budgetPerYearUSD: 5000 }, testProgram);
    expect(overBudget).toBeLessThan(60);
  });
  it("cushions the score when an accessible scholarship exists", () => {
    // Budget picked so the cushion moves the score before it clamps to 0 (too far over budget hides the effect).
    const withAid = budgetFit({ ...testProfile, budgetPerYearUSD: 15000 }, testProgram);
    const noAid = budgetFit(
      { ...testProfile, budgetPerYearUSD: 15000 },
      { ...testProgram, scholarships: [{ name: "Elite Award", coverage: "Full", competitiveness: "high" }] }
    );
    expect(withAid).toBeGreaterThan(noAid);
  });
});

describe("requirementsFit", () => {
  it("scores 100 with no gaps when every requirement is already met", () => {
    const { score, gaps } = requirementsFit(testProfile, testProgram);
    expect(score).toBe(100);
    expect(gaps).toHaveLength(0);
  });
  it("reports a gap for each unmet requirement", () => {
    const { score, gaps } = requirementsFit({ ...testProfile, languageLevel: {}, examsCompleted: [] }, testProgram);
    expect(score).toBeLessThan(100);
    expect(gaps).toHaveLength(2);
  });
});

describe("preferencesFit", () => {
  it("scores higher when research/scholarship/campus-size preferences all match", () => {
    const matching = preferencesFit(testProfile, testProgram, testUniversity);
    const mismatched = preferencesFit(
      { ...testProfile, preferences: { prioritizeResearch: true, campusSize: "large" } },
      { ...testProgram, researchOpportunities: false },
      testUniversity
    );
    expect(matching).toBeGreaterThan(mismatched);
  });
});
