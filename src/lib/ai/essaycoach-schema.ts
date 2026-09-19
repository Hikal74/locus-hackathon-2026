import { z } from "zod";

export const ESSAY_MIN_LENGTH = 80;
export const ESSAY_MAX_LENGTH = 8000;
const MAX_PROMPT_LENGTH = 1000;

export const ESSAY_DIMENSIONS = ["clarity", "specificity", "voice", "structure", "promptFit"] as const;
export const ESSAY_LEVELS = ["strong", "developing", "needs_work", "unclear"] as const;

export type EssayDimensionKey = (typeof ESSAY_DIMENSIONS)[number];
export type EssayLevel = (typeof ESSAY_LEVELS)[number];

/** Request contract for POST /api/essaycoach. The floor keeps a one-liner from spending a model call. */
export const EssayCoachRequestSchema = z.object({
  prompt: z.string().max(MAX_PROMPT_LENGTH).optional(),
  essay: z.string().min(ESSAY_MIN_LENGTH).max(ESSAY_MAX_LENGTH),
});

export type EssayCoachRequest = z.infer<typeof EssayCoachRequestSchema>;

export const EssayCoachResultSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  dimensions: z.array(
    z.object({
      key: z.enum(ESSAY_DIMENSIONS),
      level: z.enum(ESSAY_LEVELS),
      note: z.string().min(1),
    })
  ),
  suggestions: z.array(
    z.object({
      issue: z.string().min(1),
      /** Verbatim excerpt from the draft the suggestion points at. Dropped server-side if it isn't really in the draft. */
      quote: z.string().optional(),
      advice: z.string().min(1),
    })
  ),
  questionsToConsider: z.array(z.string().min(1)),
});

export type EssayCoachResult = z.infer<typeof EssayCoachResultSchema>;

/** Case-, whitespace-, and smart-quote-insensitive form used only to test whether a quote really came from the draft. */
function normalizeForMatch(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * The model is told to quote the draft verbatim, but a "quote" that isn't in the essay would show the
 * student words they never wrote. Same idea as the advisor's citation sanitizing: keep the suggestion,
 * drop the unverifiable quote. Also drops repeated dimension rows (the UI shows one per key).
 */
export function sanitizeEssayCoachResult(result: EssayCoachResult, essay: string): EssayCoachResult {
  const haystack = normalizeForMatch(essay);
  const seen = new Set<EssayDimensionKey>();
  return {
    ...result,
    dimensions: result.dimensions.filter((d) => {
      if (seen.has(d.key)) return false;
      seen.add(d.key);
      return true;
    }),
    suggestions: result.suggestions.map((s) => {
      const quote = s.quote?.trim();
      const verified = quote && haystack.includes(normalizeForMatch(quote));
      return { issue: s.issue, advice: s.advice, ...(verified ? { quote } : {}) };
    }),
  };
}
