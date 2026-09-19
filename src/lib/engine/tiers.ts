import type { Program, StudentProfile } from "@/lib/data/types";

export type FitTier = "reach" | "match" | "safety" | "unknown";

export interface FitTierResult {
  tier: FitTier;
  /** Plain-language basis, always shown next to the tier so it never reads as an unexplained verdict. */
  reason: string;
}

/**
 * How much extra GPA cushion each selectivity level needs before a program
 * counts as a "match" rather than a "reach". More selective programs get less
 * benefit of the doubt from the same published minimum.
 */
const SELECTIVITY_PENALTY: Record<Program["selectivity"], number> = {
  very_high: 0.3,
  high: 0.15,
  moderate: 0,
};

const SELECTIVITY_LABEL: Record<Program["selectivity"], string> = {
  very_high: "very high",
  high: "high",
  moderate: "moderate",
};

/**
 * Reach / Match / Safety from the student's GPA versus the program's published
 * GPA minimum, adjusted for selectivity. This is a rule of thumb over two
 * inputs, deliberately NOT an admission probability (see docs/DATA_AND_TRUST.md):
 * it ignores essays, exams, activities, and everything else admissions readers
 * actually weigh, and the UI says so wherever it's shown.
 */
export function getFitTier(profile: StudentProfile, program: Program): FitTierResult {
  const min = program.minGpaOn4Scale?.value;
  if (profile.gpaOn4Scale == null) {
    return { tier: "unknown", reason: "Add your GPA to your profile to see this." };
  }
  if (min == null) {
    return { tier: "unknown", reason: "This program has no published GPA minimum in our data." };
  }

  // Rounded so threshold comparisons aren't at the mercy of float error (e.g. 3.95 - 3.5 - 0.15).
  const diff = Math.round((profile.gpaOn4Scale - min) * 100) / 100;
  const effective = Math.round((diff - SELECTIVITY_PENALTY[program.selectivity]) * 100) / 100;
  const gap = Math.abs(diff).toFixed(1);
  const comparison =
    diff === 0
      ? `Your GPA (${profile.gpaOn4Scale.toFixed(1)}) equals the program's published minimum (${min.toFixed(1)})`
      : `Your GPA (${profile.gpaOn4Scale.toFixed(1)}) is ${gap} ${diff > 0 ? "above" : "below"} the program's published minimum (${min.toFixed(1)})`;
  const reason = `${comparison}; selectivity is ${SELECTIVITY_LABEL[program.selectivity]}.`;

  if (effective >= 0.3) return { tier: "safety", reason };
  if (effective >= 0) return { tier: "match", reason };
  return { tier: "reach", reason };
}

export const FIT_TIER_LABEL: Record<FitTier, string> = {
  reach: "Reach",
  match: "Match",
  safety: "Safety",
  unknown: "Tier unknown",
};
