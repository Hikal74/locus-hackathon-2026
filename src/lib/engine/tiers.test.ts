import { describe, expect, it } from "vitest";
import { getFitTier } from "./tiers";
import { testProfile, testProgram } from "./test-fixtures";
import type { Program, StudentProfile } from "@/lib/data/types";

const withGpa = (gpa: number | undefined): StudentProfile => ({ ...testProfile, gpaOn4Scale: gpa });
const withProgram = (min: number | undefined, selectivity: Program["selectivity"]): Program => ({
  ...testProgram,
  minGpaOn4Scale: min == null ? undefined : { value: min, status: "verified" },
  selectivity,
});

describe("getFitTier", () => {
  it("is 'unknown' with a prompt to add a GPA when the profile has none", () => {
    const result = getFitTier(withGpa(undefined), withProgram(3.5, "high"));
    expect(result.tier).toBe("unknown");
    expect(result.reason).toMatch(/add your gpa/i);
  });

  it("is 'unknown' when the program publishes no GPA minimum", () => {
    const result = getFitTier(withGpa(3.9), withProgram(undefined, "high"));
    expect(result.tier).toBe("unknown");
    expect(result.reason).toMatch(/no published gpa minimum/i);
  });

  it("is a reach when the GPA is below the published minimum", () => {
    expect(getFitTier(withGpa(3.2), withProgram(3.5, "moderate")).tier).toBe("reach");
  });

  it("is a match when the GPA meets a moderate program's minimum", () => {
    expect(getFitTier(withGpa(3.5), withProgram(3.5, "moderate")).tier).toBe("match");
  });

  it("is a safety only with a cushion of 0.3+ at moderate selectivity", () => {
    expect(getFitTier(withGpa(3.8), withProgram(3.5, "moderate")).tier).toBe("safety");
    expect(getFitTier(withGpa(3.7), withProgram(3.5, "moderate")).tier).toBe("match");
  });

  it("needs a bigger cushion at higher selectivity for the same GPA gap", () => {
    // Same 0.3 gap: safety when moderate, match when high, match-but-not-safety when very high.
    expect(getFitTier(withGpa(3.8), withProgram(3.5, "moderate")).tier).toBe("safety");
    expect(getFitTier(withGpa(3.8), withProgram(3.5, "high")).tier).toBe("match");
    expect(getFitTier(withGpa(3.8), withProgram(3.5, "very_high")).tier).toBe("match");
  });

  it("drops a very selective program to reach when the cushion is under the selectivity penalty", () => {
    // 0.2 above the minimum but very_high needs 0.3 of cushion just to be a match.
    expect(getFitTier(withGpa(3.7), withProgram(3.5, "very_high")).tier).toBe("reach");
  });

  it("is stable at the exact float-sensitive boundary (3.95 vs 3.5, high)", () => {
    expect(getFitTier(withGpa(3.95), withProgram(3.5, "high")).tier).toBe("safety");
  });

  it("always explains itself with the GPA comparison and selectivity", () => {
    const { reason } = getFitTier(withGpa(3.8), withProgram(3.5, "high"));
    expect(reason).toContain("3.8");
    expect(reason).toContain("3.5");
    expect(reason).toMatch(/above/);
    expect(reason).toMatch(/selectivity is high/);
  });
});
