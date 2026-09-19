import { describe, expect, it } from "vitest";
import { VibeCheckRequestSchema, VibeCheckResultSchema, dedupeTraits } from "./vibecheck-schema";

const validResult = {
  headline: "Heavy reader, but gives amazing feedback",
  traits: [
    { key: "workload", level: "high", evidence: "Several reviews mention 100+ pages of reading a week." },
    { key: "feedback", level: "high", evidence: "One reviewer says the comments on essays were detailed." },
    { key: "attendance", level: "unclear", evidence: "Not mentioned in the sources." },
  ],
  confidence: "low",
  coverageNote: "Only two reviews were pasted, so this is a thin picture.",
};

describe("VibeCheckRequestSchema", () => {
  it("accepts sources with an optional label", () => {
    expect(VibeCheckRequestSchema.safeParse({ sources: "Great prof, lots of reading." }).success).toBe(true);
    expect(VibeCheckRequestSchema.safeParse({ label: "CS101", sources: "Great prof." }).success).toBe(true);
  });

  it("rejects empty sources", () => {
    expect(VibeCheckRequestSchema.safeParse({ sources: "" }).success).toBe(false);
  });

  it("rejects sources beyond the length cap", () => {
    expect(VibeCheckRequestSchema.safeParse({ sources: "x".repeat(12001) }).success).toBe(false);
  });

  it("rejects an over-long label", () => {
    expect(VibeCheckRequestSchema.safeParse({ label: "x".repeat(121), sources: "ok" }).success).toBe(false);
  });
});

describe("VibeCheckResultSchema", () => {
  it("accepts a valid result without the optional lists", () => {
    expect(VibeCheckResultSchema.safeParse(validResult).success).toBe(true);
  });

  it("rejects an unknown trait key", () => {
    const bad = { ...validResult, traits: [{ key: "charisma", level: "high", evidence: "x" }] };
    expect(VibeCheckResultSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an unknown level", () => {
    const bad = { ...validResult, traits: [{ key: "workload", level: "extreme", evidence: "x" }] };
    expect(VibeCheckResultSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a missing coverageNote", () => {
    const { coverageNote: _omit, ...bad } = validResult;
    void _omit;
    expect(VibeCheckResultSchema.safeParse(bad).success).toBe(false);
  });
});

describe("dedupeTraits", () => {
  it("keeps only the first entry per trait key", () => {
    const parsed = VibeCheckResultSchema.parse({
      ...validResult,
      traits: [
        { key: "workload", level: "high", evidence: "first" },
        { key: "workload", level: "low", evidence: "second" },
        { key: "exams", level: "medium", evidence: "third" },
      ],
    });
    const deduped = dedupeTraits(parsed);
    expect(deduped.traits).toHaveLength(2);
    expect(deduped.traits[0].evidence).toBe("first");
  });
});
