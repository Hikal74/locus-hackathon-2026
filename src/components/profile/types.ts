import type { Country, CurriculumType, FieldOfStudy, Language } from "@/lib/data/types";

/** Flattened, string-bound pre-image of StudentProfile used while the form is being filled in. */
export interface Draft {
  // Level 1 — Quick Demographics
  age: string;
  grade: string;
  nativeLanguage: string;
  languageOfInstruction: Language | "";

  // Level 2 — Preferences & Aspirations
  intendedField: FieldOfStudy;
  interests: string[];
  countryPreferences: Country[];

  // Level 3 — Career Goals & Field Requirements
  careerPath: string;
  fieldWants: string[];

  // Level 4 — Metrics, Exams & Logistics
  budgetPerYearUSD: string;
  intendedIntake: string;
  gpaOn4Scale: string;
  curriculumType: CurriculumType | "";
  standardizedExamsCompleted: string[];
  languageExamsCompleted: string[];
  englishLevel: string;
  prioritizeResearch: boolean;
  prioritizeScholarship: boolean;
  additionalContext: string;
}

export type UpdateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => void;

export interface StepProps {
  draft: Draft;
  update: UpdateDraft;
}
