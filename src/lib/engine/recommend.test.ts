import { describe, expect, it } from "vitest";
import { getRecommendations } from "./recommend";
import { testProfile, testProgram, testUniversity } from "./test-fixtures";

describe("getRecommendations", () => {
  it("includes a program that matches field, country, and budget", () => {
    const { recommendations } = getRecommendations(testProfile, [testUniversity], [testProgram]);
    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].program.id).toBe(testProgram.id);
  });

  it("hard-excludes a program in a different field", () => {
    const otherFieldProgram = { ...testProgram, field: "business" as const };
    const { recommendations, excluded } = getRecommendations(testProfile, [testUniversity], [otherFieldProgram]);
    expect(recommendations).toHaveLength(0);
    expect(excluded).toHaveLength(1);
    expect(excluded[0].reason).toMatch(/field/i);
  });

  it("hard-excludes a university outside the student's selected countries", () => {
    const profile = { ...testProfile, countryPreferences: ["China" as const] };
    const { recommendations, excluded } = getRecommendations(profile, [testUniversity], [testProgram]);
    expect(recommendations).toHaveLength(0);
    expect(excluded[0].reason).toMatch(/countr/i);
  });

  it("hard-excludes tuition beyond 3x the student's budget, even with scholarships available", () => {
    const profile = { ...testProfile, budgetPerYearUSD: 1000 };
    const { recommendations, excluded } = getRecommendations(profile, [testUniversity], [testProgram]);
    expect(recommendations).toHaveLength(0);
    expect(excluded[0].reason).toMatch(/budget/i);
  });

  it("ranks recommendations by descending fit score", () => {
    const strongMatch = { ...testProgram, id: "strong" };
    const weakMatch = {
      ...testProgram,
      id: "weak",
      tuitionPerYearUSD: { value: 24000, status: "verified" as const },
      minGpaOn4Scale: { value: 3.9, status: "demo_data" as const },
    };
    const { recommendations } = getRecommendations(testProfile, [testUniversity], [weakMatch, strongMatch]);
    expect(recommendations[0].fitScore).toBeGreaterThanOrEqual(recommendations[1].fitScore);
  });

  it("never reports a fit score outside 0-100", () => {
    const { recommendations } = getRecommendations(testProfile, [testUniversity], [testProgram]);
    for (const rec of recommendations) {
      expect(rec.fitScore).toBeGreaterThanOrEqual(0);
      expect(rec.fitScore).toBeLessThanOrEqual(100);
    }
  });

  it("a custom weight vector changes ranking versus the default weights", () => {
    // "strong" wins on academics/requirements, "cheap" wins hugely on budget.
    const strong = { ...testProgram, id: "strong" };
    const cheap = {
      ...testProgram,
      id: "cheap",
      tuitionPerYearUSD: { value: 2000, status: "verified" as const },
      minGpaOn4Scale: { value: 3.95, status: "demo_data" as const },
      examRequirements: [{ name: "SAT", required: true }],
      languageRequirements: [],
    };
    const budgetOnly = {
      academic: 0,
      interest: 0,
      budget: 1,
      requirements: 0,
      location: 0,
      preferences: 0,
    };
    const { recommendations } = getRecommendations(
      testProfile,
      [testUniversity],
      [strong, cheap],
      budgetOnly
    );
    expect(recommendations[0].program.id).toBe("cheap");
  });

  it("defaults to FIT_WEIGHTS when no weight vector is passed", () => {
    const withDefault = getRecommendations(testProfile, [testUniversity], [testProgram]);
    const withExplicitDefault = getRecommendations(testProfile, [testUniversity], [testProgram], {
      academic: 0.25,
      interest: 0.2,
      budget: 0.2,
      requirements: 0.15,
      location: 0.1,
      preferences: 0.1,
    });
    expect(withDefault.recommendations[0].fitScore).toBe(withExplicitDefault.recommendations[0].fitScore);
  });
});
