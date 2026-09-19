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
  /** Ordered small steps toward this task, "so a student knows what to do right now." Falls back to the task title itself when omitted — see metro.ts's buildMetroMap. */
  microtasks?: string[];
}

const PRIORITY_ORDER: Record<RoadmapPriority, number> = { now: 0, next: 1, later: 2 };

/**
 * Generic per-category micro-step templates, used for tasks whose title is
 * generated dynamically (gap-N, apply-<programId>) and so has no stable id to
 * hand-author bespoke steps against. Fixed-id tasks below get bespoke steps instead.
 */
const GENERIC_MICROTASKS: Partial<Record<RoadmapCategory, string[]>> = {
  exams: ["Register for the test", "Prepare / study", "Take the test", "Send your official score to your target programs"],
  academic: [
    "Pick which language test fits your target programs (IELTS/TOEFL/etc.)",
    "Register",
    "Prepare",
    "Take it and send your score",
  ],
  applications: [
    "Confirm every required document is ready",
    "Complete the online application form",
    "Pay the application fee, if any",
    "Submit before the deadline and save your confirmation",
  ],
};

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
      const category = isExam ? "exams" : "academic";
      tasks.push({
        id: `gap-${tasks.length}`,
        title: gap,
        category,
        priority: "now",
        reason: `Needed for ${rec.university.name} — ${rec.program.name}.`,
        microtasks: GENERIC_MICROTASKS[category],
      });
    }
  }

  tasks.push({
    id: "documents-transcripts",
    title: "Gather official transcripts and a passport copy",
    category: "documents",
    priority: "now",
    reason: "Required by every program in your shortlist before you can submit anything.",
    microtasks: [
      "Request official transcripts from your school",
      "Get them translated/certified if a program requires it",
      "Make a digital copy for each application",
      "Get a copy of your passport ready",
    ],
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
        microtasks: GENERIC_MICROTASKS.applications,
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
      microtasks: [
        "List the scholarships each of your top programs offers",
        "Check eligibility and deadlines for each",
        "Prepare any extra materials they require",
        "Submit before their deadline",
      ],
    });
  }

  tasks.push({
    id: "recommendation-letters",
    title: "Ask two teachers for recommendation letters",
    category: "recommendation_letters",
    priority: "later",
    reason: "Most programs in your shortlist expect at least one academic reference.",
    microtasks: [
      "Pick two teachers who know your work well",
      "Ask them at least a month before your first deadline",
      "Give each of them a short summary of your goals and achievements",
      "Follow up a week before the deadline",
    ],
  });
  tasks.push({
    id: "essays",
    title: "Draft your personal statement",
    category: "essays",
    priority: "later",
    reason: "Best written after your shortlist and requirement gaps are settled.",
    microtasks: [
      "Brainstorm 2-3 possible topics",
      "Write a rough first draft",
      "Get feedback from someone else",
      "Revise and tighten it to the word limit",
    ],
  });

  return tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

/**
 * Fixed, field-tailored portfolio-building activities — deliberately NOT derived
 * from an AI reading of the student's free text. There's no structured signal in
 * the profile for "have you built a project," so unlike buildRoadmap's gap-derived
 * tasks, these are always the same 5 aspirational activities with the field name
 * substituted in, never claiming more personalization than that. The one exception
 * is the research task's reason, which reads the student's own stated preference
 * (a structured boolean field, not free-text parsing) rather than inventing one.
 */
export function buildPortfolioTasks(profile: StudentProfile): RoadmapTask[] {
  const field = FIELD_LABELS[profile.intendedField];

  return [
    {
      id: "portfolio-project",
      title: `Build a project in ${field}`,
      category: "portfolio",
      priority: "next",
      reason: "A real, finished project is the single most concrete thing admissions readers can point to.",
      microtasks: [
        "Pick an idea you're genuinely curious about",
        "Set up your tools/workspace",
        "Build a first working version",
        "Get feedback from someone",
        "Polish it and write up what you did",
      ],
    },
    {
      id: "portfolio-competition",
      title: `Enter a competition or olympiad related to ${field}`,
      category: "portfolio",
      priority: "next",
      reason: "External recognition is hard to fake — it's evidence, not a claim.",
      microtasks: [
        "Find a competition or olympiad that fits your field and timeline",
        "Check eligibility and the registration deadline",
        "Prepare or practice",
        "Register and compete",
      ],
    },
    {
      id: "portfolio-research",
      title: `Find a research, mentorship, or shadowing opportunity in ${field}`,
      category: "portfolio",
      priority: "next",
      reason: profile.preferences.prioritizeResearch
        ? "You said research opportunities matter to you — this is how you build a track record toward that, not just look for it in a program."
        : "Even informal exposure (a mentor, a shadowing week) gives you something specific to talk about.",
      microtasks: [
        "Identify a teacher, professor, or professional to reach out to",
        "Write a short, specific outreach message",
        "Follow up if you don't hear back",
        "Show up consistently once you're in",
      ],
    },
    {
      id: "portfolio-leadership",
      title: "Take on a leadership role — a club, team, or volunteer effort",
      category: "portfolio",
      priority: "next",
      reason: "Shows initiative and follow-through outside the classroom, over time — not a one-off.",
      microtasks: [
        "Find a club, team, or cause you actually care about",
        "Take on a real responsibility, not just membership",
        "Stick with it for more than one semester",
        "Be ready to describe your specific impact",
      ],
    },
    {
      id: "portfolio-showcase",
      title: "Put your work together somewhere you can point to (portfolio site, GitHub, exhibition)",
      category: "portfolio",
      priority: "next",
      reason: "Scattered achievements are easy to undersell — one place that shows all of it isn't.",
      microtasks: [
        "Pick where it'll live (personal site, GitHub, etc.)",
        "Write a short description for each piece of work",
        "Link everything in one place",
        "Keep it updated as you add more",
      ],
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
