import { describe, expect, it } from "vitest";
import { AdvisorAnalysisSchema, AdvisorRequestSchema } from "./advisor-schema";
import { testProfile } from "@/lib/engine/test-fixtures";

describe("AdvisorRequestSchema", () => {
  it("accepts a valid request with no question/history (initial analysis)", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: testProfile });
    expect(result.success).toBe(true);
  });

  it("accepts a follow-up with a question and history", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: testProfile,
      question: "What if I target China instead?",
      history: [
        { role: "user", content: "Give me an overview." },
        { role: "assistant", content: "Here's your overview." },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing profile", () => {
    const result = AdvisorRequestSchema.safeParse({ question: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid field-of-study enum value", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: { ...testProfile, intendedField: "underwater_basket_weaving" } });
    expect(result.success).toBe(false);
  });

  it("rejects a GPA outside the 0-4 range", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: { ...testProfile, gpaOn4Scale: 9.9 } });
    expect(result.success).toBe(false);
  });

  it("accepts an unusually large budget rather than capping it — the What-If input has no upper limit either", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: { ...testProfile, budgetPerYearUSD: 50_000_000 } });
    expect(result.success).toBe(true);
  });

  it("rejects a non-finite budget (NaN/Infinity from a malformed client computation)", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: { ...testProfile, budgetPerYearUSD: Infinity } });
    expect(result.success).toBe(false);
  });

  it("rejects free text over the length cap", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: { ...testProfile, additionalContext: "x".repeat(5000) },
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed history entries", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: testProfile,
      history: [{ role: "narrator", content: "not a valid role" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a profile with empty arrays/no optional fields (a mostly-blank form)", () => {
    const minimal = {
      intendedField: "computer_science",
      interests: [],
      relevantSubjects: [],
      countryPreferences: [],
      budgetPerYearUSD: 0,
      languageLevel: {},
      examsCompleted: [],
      intendedIntake: "",
      preferences: {},
    };
    const result = AdvisorRequestSchema.safeParse({ profile: minimal });
    expect(result.success).toBe(true);
  });
});

describe("AdvisorAnalysisSchema", () => {
  it("accepts a minimal response with only summary (model chose not to fill every section)", () => {
    const result = AdvisorAnalysisSchema.safeParse({ summary: "Solid, well-rounded profile." });
    expect(result.success).toBe(true);
  });

  it("accepts a fully-populated response", () => {
    const result = AdvisorAnalysisSchema.safeParse({
      summary: "Summary text.",
      profileAnalysis: "Analysis text.",
      universityAnalysis: [{ programId: "mit-cs", analysis: "Fits because…" }],
      strengths: ["Strong grades"],
      developmentAreas: ["More project depth"],
      recommendedActions: ["Build a project"],
      questionsOrMissingInformation: ["What's your SAT score?"],
      verifyBeforeRelying: ["Confirm current deadline"],
      databaseSourcesUsed: ["mit-cs"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a response missing the required summary field", () => {
    const result = AdvisorAnalysisSchema.safeParse({ strengths: ["x"] });
    expect(result.success).toBe(false);
  });

  it("rejects a response where an array field has the wrong element type", () => {
    const result = AdvisorAnalysisSchema.safeParse({ summary: "ok", strengths: [1, 2, 3] });
    expect(result.success).toBe(false);
  });

  it("rejects a non-object top-level response", () => {
    const result = AdvisorAnalysisSchema.safeParse("just a string, not the expected object");
    expect(result.success).toBe(false);
  });
});
