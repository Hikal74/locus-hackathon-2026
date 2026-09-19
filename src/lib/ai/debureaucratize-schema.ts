import { z } from "zod";

const MAX_INPUT_LENGTH = 8000;

/** Request contract for POST /api/debureaucratize — the standalone plain-language translator. */
export const DebureaucratizeRequestSchema = z.object({
  text: z.string().min(1).max(MAX_INPUT_LENGTH),
});

export type DebureaucratizeRequest = z.infer<typeof DebureaucratizeRequestSchema>;

/**
 * The model's structured output. Only `plainText` is required — a short or
 * already-plain input may have no real jargon worth glossing, so `terms` is
 * optional and the UI hides it when empty, same pattern as AdvisorAnalysisSchema.
 */
export const DebureaucratizeResultSchema = z.object({
  plainText: z.string().min(1),
  terms: z
    .array(
      z.object({
        term: z.string().min(1),
        definition: z.string().min(1),
      })
    )
    .optional(),
});

export type DebureaucratizeResult = z.infer<typeof DebureaucratizeResultSchema>;
