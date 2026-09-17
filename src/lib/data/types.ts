/**
 * Core data model for the recommendation engine.
 * Every factual field that can go stale (tuition, deadlines, requirements)
 * carries a VerificationStatus so the UI can render a trust indicator instead
 * of presenting AI-generated or outdated numbers as fact.
 */

export type VerificationStatus = "verified" | "needs_verification" | "demo_data";

export interface SourcedFact<T> {
  value: T;
  status: VerificationStatus;
  sourceUrl?: string;
  verifiedOn?: string; // ISO date
}

export type FieldOfStudy =
  | "computer_science"
  | "business"
  | "engineering"
  | "medicine"
  | "natural_sciences"
  | "humanities"
  | "arts";

export type Country = "USA" | "Kazakhstan" | "China";

export type DegreeLevel = "bachelor" | "master";

export interface LanguageRequirement {
  language: "English" | "Chinese" | "Kazakh" | "Russian";
  test?: "IELTS" | "TOEFL" | "HSK" | "none";
  minScore?: string;
}

export interface ExamRequirement {
  name: string; // e.g. "SAT", "UNT", "Gaokao (for domestic applicants)"
  required: boolean;
  notes?: string;
}

export interface Deadline {
  label: string; // e.g. "Regular Decision", "Early Action"
  date: string; // ISO date, next upcoming known cycle
}

export interface Scholarship {
  name: string;
  coverage: string; // human-readable, e.g. "Full tuition + stipend"
  competitiveness: "high" | "medium" | "low";
}

export interface Program {
  id: string;
  universityId: string;
  name: string;
  field: FieldOfStudy;
  degreeLevel: DegreeLevel;
  tuitionPerYearUSD: SourcedFact<number>;
  languageRequirements: LanguageRequirement[];
  examRequirements: ExamRequirement[];
  deadlines: Deadline[];
  scholarships: Scholarship[];
  minGpaOn4Scale?: SourcedFact<number>;
  selectivity: "very_high" | "high" | "moderate";
  researchOpportunities: boolean;
  /** Interest/research-area keywords used for interest-fit matching, e.g. "AI", "robotics", "entrepreneurship". */
  tags: string[];
  notes?: string;
}

export interface University {
  id: string;
  name: string;
  country: Country;
  city: string;
  websiteUrl: string;
  size: "small" | "medium" | "large";
  description: string;
}

/** What the student tells us about themselves. Drives the recommendation engine. */
export interface StudentProfile {
  age?: number;
  grade?: string;
  intendedField: FieldOfStudy;
  interests: string[];
  gpaOn4Scale?: number;
  relevantSubjects: string[];
  countryPreferences: Country[];
  budgetPerYearUSD: number;
  languageLevel: Partial<Record<LanguageRequirement["language"], string>>;
  examsCompleted: string[];
  intendedIntake: string; // e.g. "Fall 2027"
  preferences: {
    prioritizeResearch?: boolean;
    prioritizeScholarship?: boolean;
    campusSize?: University["size"];
  };
}
