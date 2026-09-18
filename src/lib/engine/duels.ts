import type { Program, StudentProfile, University } from "@/lib/data/types";
import { academicFit, budgetFit, interestFit, locationFit, preferencesFit, requirementsFit } from "./scoring";
import type { FactorKey } from "./types";
import { FACTOR_ORDER } from "./personalize";

export interface DuelSide {
  program: Program;
  university: University;
  facts: string[];
}

export interface Duel {
  id: string;
  factor: FactorKey;
  prompt: string;
  left: DuelSide;
  right: DuelSide;
}

function scoreFor(factor: FactorKey, profile: StudentProfile, program: Program, university: University): number {
  switch (factor) {
    case "academic":
      return academicFit(profile, program);
    case "interest":
      return interestFit(profile, program);
    case "budget":
      return budgetFit(profile, program);
    case "requirements":
      return requirementsFit(profile, program).score;
    case "location":
      return locationFit(profile, university);
    case "preferences":
      return preferencesFit(profile, program, university);
  }
}

function describeSide(program: Program, university: University): DuelSide {
  const tuition = `$${program.tuitionPerYearUSD.value.toLocaleString()}/yr`;
  const selectivity = program.selectivity.replace("_", " ");
  return {
    program,
    university,
    facts: [
      `${university.name}, ${university.country}`,
      `${tuition} tuition`,
      `${selectivity} selectivity`,
      program.researchOpportunities ? "Research opportunities" : "Teaching-focused",
    ],
  };
}

const PROMPTS: Record<FactorKey, string> = {
  academic: "Which admissions bar would you rather clear?",
  interest: "Which program actually sounds like what you want to study?",
  budget: "Which price tag can you live with?",
  requirements: "Which set of requirements feels more within reach?",
  location: "Which place would you rather spend the next few years?",
  preferences: "Which campus feels more like you?",
};

/**
 * Builds up to one duel per fit factor: sort the student's field-eligible pool by
 * that factor's already-existing deterministic score, pair the top scorer against
 * a program from a different university sitting in the middle-lower band. Facts
 * shown are plain attributes (tuition, selectivity, country) — never the score
 * itself — so the pick stays a gut call, not a rigged comparison.
 */
export function generateDuels(profile: StudentProfile, universities: University[], programs: Program[]): Duel[] {
  const universityById = new Map(universities.map((u) => [u.id, u]));
  const pool = programs.filter((p) => p.field === profile.intendedField);
  if (pool.length < 2) return [];

  const duels: Duel[] = [];

  for (const factor of FACTOR_ORDER) {
    const scored = pool
      .map((program) => {
        const university = universityById.get(program.universityId);
        if (!university) return null;
        return { program, university, score: scoreFor(factor, profile, program, university) };
      })
      .filter((x): x is { program: Program; university: University; score: number } => x !== null)
      .sort((a, b) => b.score - a.score);

    if (scored.length < 2) continue;

    const high = scored[0];
    const bandStart = Math.floor(scored.length * 0.5);
    const bandEnd = Math.max(bandStart, scored.length - 1);
    let low = scored.slice(bandStart, bandEnd + 1).find((s) => s.university.id !== high.university.id);
    if (!low) {
      low = scored.slice(1).find((s) => s.university.id !== high.university.id) ?? scored[scored.length - 1];
    }
    if (low.program.id === high.program.id) continue;

    duels.push({
      id: `${factor}-${high.program.id}-${low.program.id}`,
      factor,
      prompt: PROMPTS[factor],
      left: describeSide(high.program, high.university),
      right: describeSide(low.program, low.university),
    });
  }

  return duels;
}
