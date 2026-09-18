import type { StudentProfile } from "@/lib/data/types";
import { FIELD_LABELS } from "@/lib/data/labels";
import type { Recommendation } from "./types";

export type RoadmapCategory =
  | "academic"
  | "exams"
  | "documents"
  | "applications"
  | "scholarships"
  | "essays"
  | "recommendation_letters"
  | "portfolio";

export type RoadmapPriority = "now" | "next" | "later";

export interface RoadmapTask {
  id: string;
  title: string;
  category: RoadmapCategory;
  priority: RoadmapPriority;
  reason: string;
}

const PRIORITY_ORDER: Record<RoadmapPriority, number> = { now: 0, next: 1, later: 2 };

/**
 * Builds a prioritized roadmap from the student's top matches — not the full shortlist —
 * so the task list stays short. Every task traces back to either a genuine requirement gap
 * (from watchOut) or a real deadline on one of the top recommendations.
 */
export function buildRoadmap(profile: StudentProfile, recommendations: Recommendation[]): RoadmapTask[] {
  const top = recommendations.slice(0, 3);
  const tasks: RoadmapTask[] = [];
  const seenGap = new Set<string>();

  for (const rec of top) {
    for (const gap of rec.watchOut) {
      if (seenGap.has(gap)) continue;
      seenGap.add(gap);
      const isExam = /exam|SAT|ACT|UNT|test|HSK/i.test(gap);
      tasks.push({
        id: `gap-${tasks.length}`,
        title: gap,
        category: isExam ? "exams" : "academic",
        priority: "now",
        reason: `Needed for ${rec.university.name} — ${rec.program.name}.`,
      });
    }
  }

  tasks.push({
    id: "documents-transcripts",
    title: "Gather official transcripts and a passport copy",
    category: "documents",
    priority: "now",
    reason: "Required by every program in your shortlist before you can submit anything.",
  });

  top.forEach((rec, index) => {
    const nextDeadline = rec.program.deadlines[0];
    if (nextDeadline) {
      tasks.push({
        id: `apply-${rec.program.id}`,
        title: `Submit application to ${rec.university.name} (${nextDeadline.label}) — due ${nextDeadline.date}`,
        category: "applications",
        priority: "next",
        reason: `Your #${index + 1} matched option.`,
      });
    }
  });

  const budgetIsTight = top.some((rec) => (rec.factors.find((f) => f.key === "budget")?.score ?? 100) < 70);
  if (profile.preferences.prioritizeScholarship || budgetIsTight) {
    tasks.push({
      id: "scholarships",
      title: "Research and shortlist scholarship or financial aid options for your top programs",
      category: "scholarships",
      priority: "next",
      reason: budgetIsTight
        ? "Tuition on at least one top match is above your stated budget."
        : "You said scholarship availability matters to you.",
    });
  }

  tasks.push({
    id: "recommendation-letters",
    title: "Ask two teachers for recommendation letters",
    category: "recommendation_letters",
    priority: "later",
    reason: "Most programs in your shortlist expect at least one academic reference.",
  });
  tasks.push({
    id: "essays",
    title: "Draft your personal statement",
    category: "essays",
    priority: "later",
    reason: "Best written after your shortlist and requirement gaps are settled.",
  });

  return tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

/**
 * Fixed, field-tailored portfolio-building activities — deliberately NOT derived
 * from an AI reading of the student's free text. There's no structured signal in
 * the profile for "have you built a project," so unlike buildRoadmap's gap-derived
 * tasks, these are always the same 5 aspirational activities. Each one's reason is
 * substituted with the student's own STRUCTURED answers (field, interests, career
 * path, program wants, research priority) — never free-text parsing, never an
 * invented fact — so "what should this actually be about" is specific to them,
 * not a generic template.
 */
export function buildPortfolioTasks(profile: StudentProfile): RoadmapTask[] {
  const field = FIELD_LABELS[profile.intendedField];
  const topInterests = profile.interests.slice(0, 2);
  const interestClause = topInterests.length > 0 ? ` in ${topInterests.join(" and ")}` : "";
  const careerClause = profile.careerPath ? ` — real evidence toward becoming a ${profile.careerPath}` : "";
  const wantsLabor = profile.fieldWants.find((w) => /research/i.test(w));

  return [
    {
      id: "portfolio-project",
      title: `Build a project in ${field}${interestClause}`,
      category: "portfolio",
      priority: "next",
      reason:
        (topInterests.length > 0
          ? `Aim it squarely at ${topInterests.join(" and ")} — a specific, working thing beats a broad one.`
          : "A real, finished project is the single most concrete thing admissions readers can point to.") + careerClause + ".",
    },
    {
      id: "portfolio-competition",
      title: `Enter a competition or olympiad related to ${field}`,
      category: "portfolio",
      priority: "next",
      reason: "External recognition is hard to fake — it's evidence, not a claim.",
    },
    {
      id: "portfolio-research",
      title: `Find a research, mentorship, or shadowing opportunity in ${field}`,
      category: "portfolio",
      priority: "next",
      reason:
        profile.preferences.prioritizeResearch || wantsLabor
          ? `You said research${wantsLabor ? ` labs/facilities` : " opportunities"} matter to you — this is how you build a track record toward that, not just look for it in a program.`
          : "Even informal exposure (a mentor, a shadowing week) gives you something specific to talk about.",
    },
    {
      id: "portfolio-leadership",
      title: "Take on a leadership role — a club, team, or volunteer effort",
      category: "portfolio",
      priority: "next",
      reason: "Shows initiative and follow-through outside the classroom, over time — not a one-off.",
    },
    {
      id: "portfolio-showcase",
      title: "Put your work together somewhere you can point to (portfolio site, GitHub, exhibition)",
      category: "portfolio",
      priority: "next",
      reason: profile.careerPath
        ? `Frame it around your target of ${profile.careerPath} — scattered achievements are easy to undersell, one place that tells that specific story isn't.`
        : "Scattered achievements are easy to undersell — one place that shows all of it isn't.",
    },
  ];
}

export interface ReadinessBucket {
  label: string;
  value: number;
}

const BUCKET_CATEGORIES: { label: string; categories: RoadmapCategory[] }[] = [
  { label: "Academic preparation", categories: ["academic", "exams"] },
  { label: "Portfolio & achievements", categories: ["portfolio"] },
  { label: "Documents & funding", categories: ["documents", "scholarships"] },
  { label: "Applications & essays", categories: ["applications", "essays", "recommendation_letters"] },
];

export function computeReadiness(tasks: RoadmapTask[], completedIds: string[]): ReadinessBucket[] {
  return BUCKET_CATEGORIES.map(({ label, categories }) => {
    const bucketTasks = tasks.filter((t) => categories.includes(t.category));
    if (bucketTasks.length === 0) return { label, value: 100 };
    const done = bucketTasks.filter((t) => completedIds.includes(t.id)).length;
    return { label, value: Math.round((done / bucketTasks.length) * 100) };
  });
}
