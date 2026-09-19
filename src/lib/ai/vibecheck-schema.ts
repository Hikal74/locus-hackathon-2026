import { z } from "zod";

const MAX_SOURCES_LENGTH = 12000;
const MAX_LABEL_LENGTH = 120;

export const VIBE_TRAIT_KEYS = ["workload", "exams", "attendance", "feedback", "grading", "approachability"] as const;
export const VIBE_LEVELS = ["high", "medium", "low", "unclear"] as const;
export const VIBE_CONFIDENCE = ["low", "medium", "high"] as const;

export type VibeTraitKey = (typeof VIBE_TRAIT_KEYS)[number];
export type VibeLevel = (typeof VIBE_LEVELS)[number];

/** Request contract for POST /api/vibecheck. `sources` is student-pasted reviews / syllabus text / grade numbers. */
export const VibeCheckRequestSchema = z.object({
  label: z.string().max(MAX_LABEL_LENGTH).optional(),
  sources: z.string().min(1).max(MAX_SOURCES_LENGTH),
});

export type VibeCheckRequest = z.infer<typeof VibeCheckRequestSchema>;

/**
 * The model's structured output. Every trait carries the evidence that
 * justifies it (or says the sources don't cover it), so the UI can show *why*
 * the vibe reads that way instead of an unexplained rating.
 */
export const VibeCheckResultSchema = z.object({
  headline: z.string().min(1),
  traits: z.array(
    z.object({
      key: z.enum(VIBE_TRAIT_KEYS),
      level: z.enum(VIBE_LEVELS),
      evidence: z.string().min(1),
    })
  ),
  goodFor: z.array(z.string().min(1)).optional(),
  watchOutFor: z.array(z.string().min(1)).optional(),
  confidence: z.enum(VIBE_CONFIDENCE),
  coverageNote: z.string().min(1),
});

export type VibeCheckResult = z.infer<typeof VibeCheckResultSchema>;

/** Keeps the first entry per trait key — the model occasionally repeats one, and the UI renders one row per key. */
export function dedupeTraits(result: VibeCheckResult): VibeCheckResult {
  const seen = new Set<VibeTraitKey>();
  return {
    ...result,
    traits: result.traits.filter((t) => {
      if (seen.has(t.key)) return false;
      seen.add(t.key);
      return true;
    }),
  };
}
