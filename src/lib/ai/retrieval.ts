import type { Program, StudentProfile, University } from "@/lib/data/types";
import { getRecommendations } from "@/lib/engine/recommend";
import type { FactorScore } from "@/lib/engine/types";

/**
 * Grounded evidence handed to the AI advisor for one program. Deliberately a
 * subset of `Recommendation` (see src/lib/engine/types.ts) — the advisor gets
 * the same facts and the same already-computed fit score/factors a human would
 * see on a recommendation card, so it reasons from real numbers rather than
 * re-deriving (or inventing) its own.
 */
export interface RetrievedProgram {
  program: Program;
  university: University;
  fitScore: number;
  factors: FactorScore[];
  deterministicWhyItFits: string[];
  deterministicWatchOut: string[];
}

export interface RetrievedExclusion {
  program: Program;
  university: University;
  reason: string;
}

export interface RetrievedContext {
  matched: RetrievedProgram[];
  excludedSample: RetrievedExclusion[];
  totalMatchedInDataset: number;
  totalExcludedInDataset: number;
}

/**
 * Caps how many records ever reach the Gemini prompt, regardless of dataset
 * size — the point of retrieval, not just ranking. Today's dataset (26
 * programs) would fit in a prompt whole, but this cap is what keeps prompt
 * size and cost flat as the dataset grows well past that.
 */
const MAX_MATCHED = 8;
const MAX_EXCLUDED_SAMPLE = 4;

/**
 * Retrieves the subset of the university database relevant to a student's
 * profile, to hand to the AI advisor as grounded context — never the whole
 * dataset. Reuses the existing deterministic hard-filter + scoring pipeline
 * (`getRecommendations`, see docs/RECOMMENDATION_ENGINE.md) as the retriever:
 * the same tested, explainable logic that decides which programs appear on a
 * recommendation card also decides which records are "relevant enough" to
 * ground the advisor's reasoning. The advisor never sees or scores programs
 * this step didn't surface.
 *
 * A small sample of hard-filtered-out programs is included too (with their
 * exclusion reason) so the advisor can reason about near-misses — e.g.
 * explain that a program was excluded for being over budget, and that
 * scholarships might change that calculus — rather than pretending they don't
 * exist.
 */
export function retrieveContext(
  profile: StudentProfile,
  universities: University[],
  programs: Program[]
): RetrievedContext {
  const { recommendations, excluded } = getRecommendations(profile, universities, programs);

  const matched: RetrievedProgram[] = recommendations.slice(0, MAX_MATCHED).map((rec) => ({
    program: rec.program,
    university: rec.university,
    fitScore: rec.fitScore,
    factors: rec.factors,
    deterministicWhyItFits: rec.whyItFits,
    deterministicWatchOut: rec.watchOut,
  }));

  const excludedSample: RetrievedExclusion[] = excluded.slice(0, MAX_EXCLUDED_SAMPLE).map((ex) => ({
    program: ex.program,
    university: ex.university,
    reason: ex.reason,
  }));

  return {
    matched,
    excludedSample,
    totalMatchedInDataset: recommendations.length,
    totalExcludedInDataset: excluded.length,
  };
}

/** All program ids actually retrieved — the only ids the advisor is allowed to cite. See advisor.ts. */
export function retrievedProgramIds(context: RetrievedContext): string[] {
  return [
    ...context.matched.map((m) => m.program.id),
    ...context.excludedSample.map((e) => e.program.id),
  ];
}
