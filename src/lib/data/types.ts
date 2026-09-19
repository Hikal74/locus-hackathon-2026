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

export type Language = LanguageRequirement["language"];

export type CurriculumType = "IB" | "AP" | "A-Levels" | "National" | "Other";

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

/**
 * Cost-of-living and housing context around a university — same honesty rules
 * as every other dataset fact (see docs/DATA_AND_TRUST.md): figures that
 * couldn't be sourced against something concrete are still shown, but tagged
 * "needs_verification" or "demo_data" rather than presented as confirmed.
 */
export interface CampusLife {
  /** Rent + food + local transport estimate, excludes tuition. */
  costOfLivingPerMonthUSD: SourcedFact<number>;
  onCampusHousing: {
    available: boolean;
    priceRangePerYearUSD?: SourcedFact<[number, number]>;
    note?: string;
  };
  /** Typical cost/availability of off-campus housing near the university, in plain text. */
  offCampusHousingNote: string;
  /** Shops, transit, walkability around campus. */
  neighborhoodNote: string;
  /** General social/cultural climate for an international student. */
  socialClimateNote: string;
}

export interface University {
  id: string;
  name: string;
  country: Country;
  city: string;
  websiteUrl: string;
  size: "small" | "medium" | "large";
  description: string;
  /** Short trait phrases the university states it looks for in applicants, e.g. "Community impact". */
  valuesSought?: SourcedFact<string[]>;
  campusLife?: CampusLife;
}

/**
 * What the student tells us about themselves. Drives the recommendation engine.
 * Fields are grouped below by the onboarding effort level that collects them —
 * see src/lib/data/onboarding-steps.ts for the step sequence and level tagging.
 */
export interface StudentProfile {
  // Level 1 — Quick Demographics (zero effort)
  age?: number;
  grade?: string;
  nativeLanguage?: string;
  languageOfInstruction?: Language;

  // Level 2 — Preferences & Aspirations (low effort)
  intendedField: FieldOfStudy;
  interests: string[];
  countryPreferences: Country[];

  // Level 3 — Career Goals & Field Requirements (medium effort)
  /** Target job outcome or industry, e.g. "Software Engineer", "Doctor". */
  careerPath?: string;
  /** Curated must-have program features, e.g. "Research opportunities", "Industry accreditation". AI-advisor context only — not a scoring factor. */
  fieldWants: string[];

  // Level 4 — Metrics, Exams & Logistics (high effort)
  budgetPerYearUSD: number;
  intendedIntake: string; // e.g. "Fall 2027"
  gpaOn4Scale?: number;
  curriculumType?: CurriculumType;
  /** SAT/ACT/GRE/GMAT/UNT — matched against Program.examRequirements by requirementsFit(). */
  standardizedExamsCompleted: string[];
  /** IELTS/TOEFL/Duolingo/HSK — informational (AI advisor + diagnosis copy), not matched by the scoring engine. */
  languageExamsCompleted: string[];
  languageLevel: Partial<Record<Language, string>>;
  /** Free text, e.g. "Kazakhstani citizen". AI-advisor context only. */
  citizenshipAndVisa?: string;

  // Not yet collected by any onboarding step (pre-existing gaps, out of scope for the 4-level rework)
  relevantSubjects: string[];
  preferences: {
    prioritizeResearch?: boolean;
    prioritizeScholarship?: boolean;
    campusSize?: University["size"];
  };
  /**
   * Free-text room for anything the structured fields above don't capture —
   * projects, competitions, research, leadership, awards, volunteering, career
   * goals, concerns. Optional, unbounded in content (length-capped at the API
   * boundary — see src/lib/ai/advisor-schema.ts), and never parsed by the
   * deterministic engine; it only reaches the AI advisor (src/lib/ai/advisor.ts),
   * which is the one consumer able to reason over free-form evidence.
   */
  additionalContext?: string;
}
