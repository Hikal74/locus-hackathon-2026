import { describe, expect, it } from "vitest";
import {
  EssayCoachRequestSchema,
  EssayCoachResultSchema,
  ESSAY_MAX_LENGTH,
  ESSAY_MIN_LENGTH,
  sanitizeEssayCoachResult,
  type EssayCoachResult,
} from "./essaycoach-schema";

const essay =
  "When I was twelve I took apart my grandfather’s radio and couldn't put it back together.\nIt took me three months to fix it, and that's when I learned patience.";

const base: EssayCoachResult = {
  summary: "A specific, personal opening with a thin ending.",
  strengths: ["The radio story is concrete."],
  dimensions: [{ key: "specificity", level: "strong", note: "Names the radio and the three months." }],
  suggestions: [],
  questionsToConsider: ["What did you actually change to make it work?"],
};

describe("EssayCoachRequestSchema", () => {
  it("accepts an essay with an optional prompt", () => {
    const longEnough = "x".repeat(ESSAY_MIN_LENGTH);
    expect(EssayCoachRequestSchema.safeParse({ essay: longEnough }).success).toBe(true);
    expect(EssayCoachRequestSchema.safeParse({ essay: longEnough, prompt: "Describe a challenge." }).success).toBe(true);
  });

  it("rejects an essay shorter than the floor", () => {
    expect(EssayCoachRequestSchema.safeParse({ essay: "x".repeat(ESSAY_MIN_LENGTH - 1) }).success).toBe(false);
  });

  it("rejects an essay beyond the cap and an over-long prompt", () => {
    expect(EssayCoachRequestSchema.safeParse({ essay: "x".repeat(ESSAY_MAX_LENGTH + 1) }).success).toBe(false);
    expect(EssayCoachRequestSchema.safeParse({ essay: "x".repeat(100), prompt: "p".repeat(1001) }).success).toBe(false);
  });
});

describe("EssayCoachResultSchema", () => {
  it("accepts a valid result", () => {
    expect(EssayCoachResultSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an unknown dimension key", () => {
    const bad = { ...base, dimensions: [{ key: "grammar", level: "strong", note: "x" }] };
    expect(EssayCoachResultSchema.safeParse(bad).success).toBe(false);
  });

  it("requires a summary", () => {
    const { summary: _omit, ...bad } = base;
    void _omit;
    expect(EssayCoachResultSchema.safeParse(bad).success).toBe(false);
  });
});

describe("sanitizeEssayCoachResult", () => {
  const withSuggestions = (suggestions: EssayCoachResult["suggestions"]): EssayCoachResult => ({ ...base, suggestions });

  it("keeps a quote that appears verbatim in the draft", () => {
    const out = sanitizeEssayCoachResult(
      withSuggestions([{ issue: "Tell more", quote: "took apart my grandfather’s radio", advice: "Say what you learned." }]),
      essay
    );
    expect(out.suggestions[0].quote).toBe("took apart my grandfather’s radio");
  });

  it("tolerates case, whitespace, and smart-quote differences", () => {
    const out = sanitizeEssayCoachResult(
      withSuggestions([{ issue: "x", quote: "TOOK APART MY GRANDFATHER'S   RADIO", advice: "y" }]),
      essay
    );
    expect(out.suggestions[0].quote).toBeDefined();
  });

  it("matches a quote that spans a line break in the draft", () => {
    const out = sanitizeEssayCoachResult(
      withSuggestions([{ issue: "x", quote: "put it back together. It took me three months", advice: "y" }]),
      essay
    );
    expect(out.suggestions[0].quote).toBeDefined();
  });

  it("drops a quote that is not in the draft but keeps the suggestion itself", () => {
    const out = sanitizeEssayCoachResult(
      withSuggestions([{ issue: "Vague ending", quote: "I have always loved engineering", advice: "Add a concrete moment." }]),
      essay
    );
    expect(out.suggestions).toHaveLength(1);
    expect(out.suggestions[0].quote).toBeUndefined();
    expect(out.suggestions[0].advice).toBe("Add a concrete moment.");
  });

  it("drops an empty or whitespace-only quote", () => {
    const out = sanitizeEssayCoachResult(withSuggestions([{ issue: "x", quote: "   ", advice: "y" }]), essay);
    expect(out.suggestions[0].quote).toBeUndefined();
  });

  it("keeps only the first row per dimension", () => {
    const out = sanitizeEssayCoachResult(
      {
        ...base,
        dimensions: [
          { key: "clarity", level: "strong", note: "first" },
          { key: "clarity", level: "needs_work", note: "second" },
          { key: "voice", level: "developing", note: "third" },
        ],
      },
      essay
    );
    expect(out.dimensions).toHaveLength(2);
    expect(out.dimensions[0].note).toBe("first");
  });
});
