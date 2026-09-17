import type { Program, StudentProfile, University } from "@/lib/data/types";

/** Academic fit: how the student's GPA compares to the program's published minimum. */
export function academicFit(profile: StudentProfile, program: Program): number {
  const min = program.minGpaOn4Scale?.value;
  if (min == null || profile.gpaOn4Scale == null) return 60; // unknown on either side — neutral, not penalized
  const diff = profile.gpaOn4Scale - min;
  if (diff >= 0.3) return 100;
  if (diff >= 0) return 85;
  if (diff >= -0.2) return 60;
  if (diff >= -0.5) return 35;
  return 15;
}

/** Interest fit: overlap between the student's stated interests and the program's tagged research/subject areas. */
export function interestFit(profile: StudentProfile, program: Program): number {
  if (profile.interests.length === 0) return 55; // no signal — neutral
  const tags = program.tags.map((t) => t.toLowerCase());
  const matches = profile.interests.filter((interest) => {
    const needle = interest.toLowerCase();
    return tags.some((tag) => tag.includes(needle) || needle.includes(tag));
  });
  const ratio = matches.length / profile.interests.length;
  return Math.round(30 + ratio * 70);
}

/** Location fit: rewards the university's country matching the student's ranked preference order. */
export function locationFit(profile: StudentProfile, university: University): number {
  const rank = profile.countryPreferences.indexOf(university.country);
  if (rank === -1) return 0;
  if (rank === 0) return 100;
  if (rank === 1) return 80;
  return 60;
}

/** Budget fit: comfortably under budget scores high; over budget scores down, cushioned slightly if accessible aid exists. */
export function budgetFit(profile: StudentProfile, program: Program): number {
  const tuition = program.tuitionPerYearUSD.value;
  const budget = profile.budgetPerYearUSD;
  if (tuition <= budget) {
    const slack = (budget - tuition) / Math.max(budget, 1);
    return Math.round(80 + Math.min(slack, 1) * 20);
  }
  const over = (tuition - budget) / Math.max(budget, 1);
  const hasAccessibleAid = program.scholarships.some((s) => s.competitiveness !== "high");
  const cushion = hasAccessibleAid ? 15 : 0;
  return Math.max(0, Math.round(60 - over * 100) + cushion);
}

/** Requirement readiness: how much of the language/exam requirements the student has already satisfied. */
export function requirementsFit(
  profile: StudentProfile,
  program: Program
): { score: number; gaps: string[] } {
  let total = 0;
  let count = 0;
  const gaps: string[] = [];

  for (const req of program.languageRequirements) {
    count++;
    const level = profile.languageLevel[req.language];
    if (level) {
      total += 100;
    } else {
      total += 30;
      const testLabel = req.test && req.test !== "none" ? `${req.test}${req.minScore ? ` ${req.minScore}` : ""}` : "test";
      gaps.push(`${req.language} proficiency (${testLabel}) not yet confirmed`);
    }
  }

  for (const req of program.examRequirements) {
    if (!req.required) continue;
    count++;
    const done = profile.examsCompleted.some((e) => e.toLowerCase().includes(req.name.toLowerCase()));
    if (done) {
      total += 100;
    } else {
      total += 30;
      gaps.push(`${req.name} not yet completed`);
    }
  }

  if (count === 0) return { score: 70, gaps };
  return { score: Math.round(total / count), gaps };
}

/** Preference fit: research emphasis, scholarship availability, and campus size against stated soft preferences. */
export function preferencesFit(profile: StudentProfile, program: Program, university: University): number {
  let score = 60;
  const { prioritizeResearch, prioritizeScholarship, campusSize } = profile.preferences;

  if (prioritizeResearch != null) {
    score += prioritizeResearch === program.researchOpportunities ? 20 : -10;
  }
  if (prioritizeScholarship != null) {
    const hasAid = program.scholarships.length > 0;
    if (prioritizeScholarship) score += hasAid ? 20 : -10;
  }
  if (campusSize) {
    score += campusSize === university.size ? 15 : -5;
  }

  return Math.max(0, Math.min(100, score));
}
