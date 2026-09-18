import { z } from "zod";

/**
 * Request/response contracts for the AI advisor (POST /api/advisor), and the
 * shape Gemini's structured output is validated against before anything in it
 * is trusted. Mirrors src/lib/data/types.ts's StudentProfile — kept as a
 * separate schema (not derived from the TS type) because this one also owns
 * the request-boundary concerns the TS type doesn't need: length caps on
 * free-text fields and tolerance for the exact shape a browser actually sends.
 */

const MAX_FREE_TEXT = 4000;
const MAX_HISTORY_TURNS = 8;
// The assistant side of a history turn is the prior response's `summary` field
// (see use-advisor.ts), which AdvisorAnalysisSchema below leaves uncapped —
// Gemini's own "comprehensive analysis" summaries routinely run well past
// 2000 characters. Too tight a cap here means the first follow-up question
// after a real analysis 400s, and stays broken for every later follow-up too,
// since the same history keeps getting resent. Mirrors the identical fix
// applied to chat-schema.ts's MAX_MESSAGE_LENGTH.
const MAX_HISTORY_TURN_LENGTH = 8000;
const MAX_QUESTION_LENGTH = 1000;

const FieldOfStudySchema = z.enum([
  "computer_science",
  "business",
  "engineering",
  "medicine",
  "natural_sciences",
  "humanities",
  "arts",
]);

const CountrySchema = z.enum(["USA", "Kazakhstan", "China"]);

export const StudentProfileRequestSchema = z.object({
  age: z.number().min(10).max(100).optional(),
  grade: z.string().max(100).optional(),
  intendedField: FieldOfStudySchema,
  interests: z.array(z.string().max(100)).max(30),
  // Clamped, not rejected: the profile form labels this "4.0 scale," but
  // nothing before this schema enforced that (an HTML `max` attribute alone
  // doesn't stop a typed value from exceeding it), and this dataset's own
  // Kazakhstan universities are a real case where a student's actual GPA
  // often isn't natively on a 4.0 scale. A single out-of-range legacy value
  // shouldn't 400 the entire AI advisor for every unrelated question — see
  // the real report this fixed: a stored profile with gpaOn4Scale > 4 broke
  // every /api/chat and /api/advisor request, including "what is Pathlight?"
  gpaOn4Scale: z
    .number()
    .finite()
    .transform((v) => Math.min(4, Math.max(0, v)))
    .optional(),
  relevantSubjects: z.array(z.string().max(100)).max(30),
  countryPreferences: z.array(CountrySchema).max(10),
  // No upper cap: the What-If budget input (src/app/recommendations/page.tsx)
  // has none either, and an unusually large budget isn't invalid input the
  // way a huge free-text blob is — just require it be a real, non-negative
  // number (rules out NaN/Infinity from a malformed client-side computation).
  budgetPerYearUSD: z.number().min(0).finite(),
  // Partial<Record<Language, string>> on the StudentProfile type — keys aren't
  // strictly enum-checked here since `z.record` over an enum requires every
  // key present, which would reject valid partial data (e.g. English only).
  languageLevel: z.record(z.string().max(20), z.string().max(100)),
  examsCompleted: z.array(z.string().max(100)).max(30),
  intendedIntake: z.string().max(100),
  preferences: z.object({
    prioritizeResearch: z.boolean().optional(),
    prioritizeScholarship: z.boolean().optional(),
    campusSize: z.enum(["small", "medium", "large"]).optional(),
  }),
  additionalContext: z.string().max(MAX_FREE_TEXT).optional(),
});

const HistoryTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(MAX_HISTORY_TURN_LENGTH),
});

export const AdvisorRequestSchema = z.object({
  profile: StudentProfileRequestSchema,
  question: z.string().max(MAX_QUESTION_LENGTH).optional(),
  history: z.array(HistoryTurnSchema).max(MAX_HISTORY_TURNS).optional(),
});

export type AdvisorRequest = z.infer<typeof AdvisorRequestSchema>;

/**
 * The advisor's structured output. Only `summary` is required — Gemini is
 * explicitly instructed (see advisor-prompt.ts) not to force irrelevant
 * sections, and the UI (AdvisorPanel) hides any section that comes back
 * empty/missing. `programId` values are validated against the actual
 * retrieved record set server-side after parsing — see advisor.ts's
 * `sanitizeProgramIds` — so this schema only checks shape, not truthfulness.
 */
export const AdvisorAnalysisSchema = z.object({
  summary: z.string().min(1),
  profileAnalysis: z.string().optional(),
  universityAnalysis: z
    .array(
      z.object({
        programId: z.string(),
        analysis: z.string(),
      })
    )
    .optional(),
  strengths: z.array(z.string()).optional(),
  developmentAreas: z.array(z.string()).optional(),
  recommendedActions: z.array(z.string()).optional(),
  questionsOrMissingInformation: z.array(z.string()).optional(),
  verifyBeforeRelying: z.array(z.string()).optional(),
  databaseSourcesUsed: z.array(z.string()).optional(),
});

export type AdvisorAnalysis = z.infer<typeof AdvisorAnalysisSchema>;
