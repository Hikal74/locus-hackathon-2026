import type { StudentProfile } from "./types";

/**
 * Judge-mode sample profile (see docs/DEMO_WALKTHROUGH.md).
 * Deliberately spans all 3 countries in the dataset and leaves a couple of
 * real gaps (no SAT yet, budget tight against 2 of the 3 US options) so the
 * diagnosis, watch-outs, and roadmap all have genuine content to show.
 */
export const sampleProfile: StudentProfile = {
  age: 17,
  grade: "12th grade",
  intendedField: "computer_science",
  interests: ["AI", "research", "software engineering"],
  gpaOn4Scale: 3.7,
  relevantSubjects: ["Math", "Computer Science", "Physics"],
  countryPreferences: ["Kazakhstan", "USA", "China"],
  budgetPerYearUSD: 18000,
  languageLevel: { English: "IELTS 6.5" },
  examsCompleted: ["IELTS"],
  intendedIntake: "Fall 2027",
  preferences: {
    prioritizeResearch: true,
    prioritizeScholarship: true,
    campusSize: "medium",
  },
  additionalContext:
    "Built a machine learning project that classifies plant diseases from photos, used by a couple of local farmers as a pilot — no formal competition result, just a personal/school project. Captain of the school's robotics club (2 years). No published research or national-level competition placements yet. Long-term goal is to work in applied AI, ideally research-adjacent. Main worry: portfolio feels thin on formal recognition (no olympiad medals, no research papers) compared to what top CS programs seem to expect.",
};
