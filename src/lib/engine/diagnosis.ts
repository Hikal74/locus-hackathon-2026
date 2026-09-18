import type { StudentProfile } from "@/lib/data/types";
import { FIELD_LABELS } from "@/lib/data/labels";

export interface Diagnosis {
  goal: string;
  strengths: string[];
  constraints: string[];
  gaps: string[];
}

/**
 * Deterministic, template-based diagnosis — no LLM call. Every line traces to a
 * specific profile field so it never claims something the data doesn't support.
 * See docs/RECOMMENDATION_ENGINE.md for why this stays rule-based.
 */
export function buildDiagnosis(profile: StudentProfile): Diagnosis {
  const strengths: string[] = [];
  const constraints: string[] = [];
  const gaps: string[] = [];

  if (profile.gpaOn4Scale != null) {
    strengths.push(
      profile.gpaOn4Scale >= 3.5
        ? `A ${profile.gpaOn4Scale.toFixed(1)} GPA is competitive for most programs in your selected countries.`
        : `A ${profile.gpaOn4Scale.toFixed(1)} GPA fits the more accessible programs in your shortlist.`
    );
  } else {
    gaps.push("GPA not provided — we can't yet judge how competitive your academic profile is for selective programs.");
  }

  const languages = Object.entries(profile.languageLevel).filter(([, v]) => v);
  if (languages.length > 0) {
    strengths.push(`Confirmed language level (${languages.map(([lang, level]) => `${lang}: ${level}`).join(", ")}) — this won't hold up most applications.`);
  } else {
    gaps.push("No language proficiency confirmed yet — this affects every program in the dataset.");
  }

  const examsCompleted = [...profile.standardizedExamsCompleted, ...profile.languageExamsCompleted];
  if (examsCompleted.length > 0) {
    strengths.push(`Already completed: ${examsCompleted.join(", ")}.`);
  } else {
    constraints.push("No standardized tests completed yet — several programs require SAT, UNT, or HSK scores.");
  }

  if (profile.interests.length > 0) {
    strengths.push(`Clear interest areas (${profile.interests.join(", ")}) will sharpen which programs actually fit.`);
  } else {
    gaps.push("No specific interests selected — matches will rely on field, country, and budget alone.");
  }

  if (profile.countryPreferences.length === 1) {
    constraints.push(`Only considering ${profile.countryPreferences[0]} narrows the shortlist significantly — adding a second country would open more options.`);
  }

  const goal = `${FIELD_LABELS[profile.intendedField]} at the bachelor's level, starting ${profile.intendedIntake}, in ${profile.countryPreferences.join(
    " or "
  )}${profile.budgetPerYearUSD ? `, within about $${profile.budgetPerYearUSD.toLocaleString()}/year` : ""}.`;

  return { goal, strengths, constraints, gaps };
}
