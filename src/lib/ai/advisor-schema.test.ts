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

  /**
   * Regression test for a real live bug report: a stored profile with
   * gpaOn4Scale above 4 (e.g. a non-4.0-scale GPA, like Kazakhstan commonly
   * uses) 400'd every AI advisor request for that student, including
   * completely unrelated questions like "what is Pathlight?" — because the
   * whole request was rejected instead of just clamping the one bad field.
   */
  it("clamps an above-range GPA to 4 rather than rejecting the whole request", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: { ...testProfile, gpaOn4Scale: 4.8 } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.profile.gpaOn4Scale).toBe(4);
  });

  it("clamps a below-range GPA to 0 rather than rejecting the whole request", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: { ...testProfile, gpaOn4Scale: -1 } });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.profile.gpaOn4Scale).toBe(0);
  });

  it("still rejects a non-finite GPA (NaN/Infinity)", () => {
    const result = AdvisorRequestSchema.safeParse({ profile: { ...testProfile, gpaOn4Scale: Infinity } });
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

  /**
   * Regression test: the assistant side of a history turn is a prior
   * response's `summary` field (see use-advisor.ts), which AdvisorAnalysisSchema
   * leaves uncapped -- a real "comprehensive analysis" summary from Gemini
   * routinely runs past a couple thousand characters. Too tight a cap here
   * means the first follow-up question after a real analysis 400s, and stays
   * broken for every later follow-up too, since the same history is resent
   * each time. Same bug class as chat-schema.test.ts's long-message case.
   */
  it("accepts a long assistant summary in history, within the raised per-turn cap", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: testProfile,
      question: "What about China instead?",
      history: [{ role: "assistant", content: "x".repeat(6000) }],
    });
    expect(result.success).toBe(true);
  });

  it("still rejects a history turn beyond the per-turn cap", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: testProfile,
      history: [{ role: "assistant", content: "x".repeat(8001) }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts the new Level 1/3/4 fields (career path, wants, curriculum, split exams, citizenship)", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: {
        ...testProfile,
        nativeLanguage: "Kazakh",
        languageOfInstruction: "English",
        careerPath: "Software Engineer",
        fieldWants: ["Research labs / facilities", "Internship placement"],
        curriculumType: "National",
        standardizedExamsCompleted: ["SAT", "UNT"],
        languageExamsCompleted: ["IELTS", "HSK"],
        citizenshipAndVisa: "Kazakhstani citizen",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid languageOfInstruction enum value", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: { ...testProfile, languageOfInstruction: "Klingon" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid curriculumType enum value", () => {
    const result = AdvisorRequestSchema.safeParse({
      profile: { ...testProfile, curriculumType: "Homeschool" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a profile missing the required standardizedExamsCompleted/languageExamsCompleted arrays", () => {
    const profile: Record<string, unknown> = { ...testProfile };
    delete profile.standardizedExamsCompleted;
    delete profile.languageExamsCompleted;
    profile.examsCompleted = ["SAT"]; // old, now-removed key
    const result = AdvisorRequestSchema.safeParse({ profile });
    expect(result.success).toBe(false);
  });

  it("accepts a profile with empty arrays/no optional fields (a mostly-blank form)", () => {
    const minimal = {
      intendedField: "computer_science",
      interests: [],
      fieldWants: [],
      relevantSubjects: [],
      countryPreferences: [],
      budgetPerYearUSD: 0,
      languageLevel: {},
      standardizedExamsCompleted: [],
      languageExamsCompleted: [],
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
