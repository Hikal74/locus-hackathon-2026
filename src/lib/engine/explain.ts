import type { Program, StudentProfile, University } from "@/lib/data/types";
import type { FactorScore } from "./types";

function factorMap(factors: FactorScore[]): Record<string, number> {
  return Object.fromEntries(factors.map((f) => [f.key, f.score]));
}

/** Builds "why it fits" copy strictly from the factor scores actually computed — never invents a reason. */
export function buildWhyItFits(
  profile: StudentProfile,
  university: University,
  program: Program,
  factors: FactorScore[]
): string[] {
  const scores = factorMap(factors);
  const reasons: string[] = [];

  if (scores.academic >= 80) {
    reasons.push("Your academic record comfortably meets this program's typical admitted range.");
  }
  if (scores.interest >= 70 && profile.interests.length > 0) {
    reasons.push(`Matches your stated interest in ${profile.interests.slice(0, 2).join(" and ")}.`);
  }
  if (scores.location === 100) {
    reasons.push(`${university.country} is your top preferred destination.`);
  }
  if (scores.budget >= 80) {
    reasons.push("Tuition fits comfortably within your stated budget.");
  } else if (program.scholarships.length > 0) {
    reasons.push(`Tuition alone exceeds budget, but ${program.scholarships[0].name} could close the gap.`);
  }
  if (scores.preferences >= 75 && profile.preferences.prioritizeResearch && program.researchOpportunities) {
    reasons.push("Strong research opportunities, matching what you said matters to you.");
  }
  if (reasons.length === 0) {
    reasons.push("Meets your core field, country, and budget constraints.");
  }
  return reasons;
}

/** Builds "watch out" copy from actual requirement gaps and weak factors — surfaced, not hidden. */
export function buildWatchOut(gaps: string[], factors: FactorScore[]): string[] {
  const scores = factorMap(factors);
  const watch = [...gaps];

  if (scores.budget < 60) {
    watch.push("Cost is above your stated budget — confirm scholarship or aid options before applying.");
  }
  if (scores.academic < 50) {
    watch.push("Your current academic profile is below this program's typical admitted range.");
  }
  return watch;
}
