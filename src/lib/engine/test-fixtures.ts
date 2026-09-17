import type { Program, StudentProfile, University } from "@/lib/data/types";

export const testUniversity: University = {
  id: "test-uni",
  name: "Test University",
  country: "USA",
  city: "Testville",
  websiteUrl: "https://example.com",
  size: "medium",
  description: "A test university.",
};

export const testProgram: Program = {
  id: "test-cs",
  universityId: "test-uni",
  name: "Computer Science",
  field: "computer_science",
  degreeLevel: "bachelor",
  tuitionPerYearUSD: { value: 20000, status: "verified", sourceUrl: "https://example.com", verifiedOn: "2026-01-01" },
  languageRequirements: [{ language: "English", test: "IELTS", minScore: "6.5" }],
  examRequirements: [{ name: "SAT", required: true }],
  deadlines: [{ label: "Regular", date: "2027-01-01" }],
  scholarships: [{ name: "Merit Scholarship", coverage: "Partial tuition", competitiveness: "medium" }],
  minGpaOn4Scale: { value: 3.5, status: "demo_data" },
  selectivity: "high",
  researchOpportunities: true,
  tags: ["AI", "research"],
};

export const testProfile: StudentProfile = {
  intendedField: "computer_science",
  interests: ["AI"],
  relevantSubjects: [],
  countryPreferences: ["USA"],
  budgetPerYearUSD: 25000,
  languageLevel: { English: "IELTS 6.5" },
  examsCompleted: ["SAT"],
  intendedIntake: "Fall 2027",
  gpaOn4Scale: 3.8,
  preferences: { prioritizeResearch: true, prioritizeScholarship: true, campusSize: "medium" },
};
