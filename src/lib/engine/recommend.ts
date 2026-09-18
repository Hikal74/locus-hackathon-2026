import type { Program, StudentProfile, University } from "@/lib/data/types";
import { academicFit, budgetFit, interestFit, locationFit, preferencesFit, requirementsFit } from "./scoring";
import { buildWhyItFits, buildWatchOut } from "./explain";
import { BUDGET_HARD_CEILING_MULTIPLIER, FIT_WEIGHTS } from "./weights";
import type { FactorScore, Recommendation, RecommendationResult } from "./types";

/**
 * Hard constraints that remove an option entirely rather than scoring it down.
 * Returns a human-readable exclusion reason, or null if the option survives filtering.
 */
function hardFilterReason(profile: StudentProfile, university: University, program: Program): string | null {
  if (program.field !== profile.intendedField) {
    return "Different field of study than what you're looking for";
  }
  if (!profile.countryPreferences.includes(university.country)) {
    return "Not in one of your selected countries";
  }
  const tuition = program.tuitionPerYearUSD.value;
  if (tuition > profile.budgetPerYearUSD * BUDGET_HARD_CEILING_MULTIPLIER) {
    return "Tuition far exceeds your stated budget, even accounting for typical aid";
  }
  return null;
}

/**
 * Structured recommendation pipeline: hard-filter -> per-factor scoring -> weighted fit score -> explanation.
 * This is the entire matching logic — no LLM call decides which universities appear here.
 * See docs/RECOMMENDATION_ENGINE.md for the weighting rationale.
 */
export function getRecommendations(
  profile: StudentProfile,
  universities: University[],
  programs: Program[],
  weights: Record<FactorScore["key"], number> = FIT_WEIGHTS
): RecommendationResult {
  const universityById = new Map(universities.map((u) => [u.id, u]));
  const recommendations: Recommendation[] = [];
  const excluded: RecommendationResult["excluded"] = [];

  for (const program of programs) {
    const university = universityById.get(program.universityId);
    if (!university) continue;

    const reason = hardFilterReason(profile, university, program);
    if (reason) {
      excluded.push({ program, university, reason });
      continue;
    }

    const { score: requirementsScore, gaps } = requirementsFit(profile, program);
    const factors: FactorScore[] = [
      { key: "academic", label: "Academic fit", score: academicFit(profile, program) },
      { key: "interest", label: "Interest fit", score: interestFit(profile, program) },
      { key: "location", label: "Location fit", score: locationFit(profile, university) },
      { key: "budget", label: "Budget fit", score: budgetFit(profile, program) },
      { key: "requirements", label: "Requirement readiness", score: requirementsScore },
      { key: "preferences", label: "Preference fit", score: preferencesFit(profile, program, university) },
    ];

    const fitScore = Math.round(factors.reduce((sum, f) => sum + f.score * weights[f.key], 0));

    recommendations.push({
      program,
      university,
      fitScore,
      factors,
      whyItFits: buildWhyItFits(profile, university, program, factors),
      watchOut: buildWatchOut(gaps, factors),
    });
  }

  recommendations.sort((a, b) => b.fitScore - a.fitScore);
  return { recommendations, excluded };
}
