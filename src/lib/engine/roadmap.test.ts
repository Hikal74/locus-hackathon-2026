import { describe, expect, it } from "vitest";
import { getRecommendations } from "./recommend";
import { buildPortfolioTasks, buildRoadmap, computeReadiness } from "./roadmap";
import { testProfile, testProgram, testUniversity } from "./test-fixtures";

describe("buildRoadmap", () => {
  it("always includes a documents task, regardless of profile completeness", () => {
    const { recommendations } = getRecommendations(testProfile, [testUniversity], [testProgram]);
    const tasks = buildRoadmap(testProfile, recommendations);
    expect(tasks.some((t) => t.id === "documents-transcripts")).toBe(true);
  });

  it("turns an unmet requirement gap into a 'now' priority task", () => {
    const profile = { ...testProfile, languageLevel: {}, standardizedExamsCompleted: [] };
    const { recommendations } = getRecommendations(profile, [testUniversity], [testProgram]);
    const tasks = buildRoadmap(profile, recommendations);
    const gapTasks = tasks.filter((t) => t.id.startsWith("gap-"));
    expect(gapTasks.length).toBeGreaterThan(0);
    expect(gapTasks.every((t) => t.priority === "now")).toBe(true);
  });

  it("adds a scholarship-research task when budget is tight against a top match", () => {
    const profile = { ...testProfile, budgetPerYearUSD: 15000, preferences: {} };
    const { recommendations } = getRecommendations(profile, [testUniversity], [testProgram]);
    const tasks = buildRoadmap(profile, recommendations);
    expect(tasks.some((t) => t.id === "scholarships")).toBe(true);
  });

  it("returns an empty roadmap gracefully when there are no matched programs", () => {
    const tasks = buildRoadmap(testProfile, []);
    expect(tasks.some((t) => t.id.startsWith("apply-"))).toBe(false);
  });
});

describe("computeReadiness", () => {
  it("reports 100% for a bucket with no applicable tasks", () => {
    const readiness = computeReadiness([], []);
    expect(readiness.every((r) => r.value === 100)).toBe(true);
  });

  it("reports partial completion accurately", () => {
    const tasks = [
      { id: "a", title: "A", category: "academic" as const, priority: "now" as const, reason: "" },
      { id: "b", title: "B", category: "academic" as const, priority: "now" as const, reason: "" },
    ];
    const readiness = computeReadiness(tasks, ["a"]);
    const academicBucket = readiness.find((r) => r.label === "Academic preparation");
    expect(academicBucket?.value).toBe(50);
  });

  it("includes a Portfolio & achievements bucket", () => {
    const readiness = computeReadiness(buildPortfolioTasks(testProfile), []);
    expect(readiness.some((r) => r.label === "Portfolio & achievements")).toBe(true);
  });
});

describe("buildPortfolioTasks", () => {
  it("returns 5 fixed portfolio tasks, all in the portfolio category", () => {
    const tasks = buildPortfolioTasks(testProfile);
    expect(tasks).toHaveLength(5);
    expect(tasks.every((t) => t.category === "portfolio")).toBe(true);
  });

  it("substitutes the student's field into the task titles", () => {
    const tasks = buildPortfolioTasks({ ...testProfile, intendedField: "business" });
    expect(tasks.some((t) => t.title.includes("Business"))).toBe(true);
  });

  it("notes the student's stated research priority in the research task's reason, when set", () => {
    const withPriority = buildPortfolioTasks({ ...testProfile, preferences: { prioritizeResearch: true } });
    const withoutPriority = buildPortfolioTasks({ ...testProfile, preferences: {} });
    const researchTask = (tasks: ReturnType<typeof buildPortfolioTasks>) => tasks.find((t) => t.id === "portfolio-research");
    expect(researchTask(withPriority)?.reason).toMatch(/you said/i);
    expect(researchTask(withoutPriority)?.reason).not.toMatch(/you said/i);
  });

  it("never depends on recommendations — always returns the same tasks regardless of matches", () => {
    const tasks = buildPortfolioTasks(testProfile);
    expect(tasks.length).toBeGreaterThan(0);
  });
});
