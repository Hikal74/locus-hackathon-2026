import { Type } from "@google/genai";
import { getGeminiClient, isAiConfigured, AI_MODEL } from "./client";
import { classifyGeminiError, type AiFailureReason } from "./errors";
import { DebureaucratizeResultSchema, type DebureaucratizeResult } from "./debureaucratize-schema";

export type DebureaucratizeFailureReason = AiFailureReason;
export type DebureaucratizeCallResult =
  | { ok: true; data: DebureaucratizeResult }
  | { ok: false; reason: DebureaucratizeFailureReason };

/**
 * Standalone plain-language translator (De-Bureaucratizer) — unlike explain.ts's
 * rephrasing, the input here is arbitrary student-pasted text (an admissions
 * policy paragraph, a financial-aid clause, anything formal/academic), so
 * there's no safe deterministic paraphrase to fall back to on failure. Same
 * honest-error philosophy as the advisor/chat: a real error, never a fallback
 * dressed up as a working translation.
 */
const SYSTEM_INSTRUCTION = `You rewrite formal, academic, or bureaucratic text into clear, plain language for a secondary-school student.

Rules, strictly enforced:
1. Rewrite ONLY what is in the given text. Never add a fact, requirement, number, or claim that isn't already present. Never guess at what an ambiguous clause "probably" means — if something is genuinely unclear, say so in the rewrite rather than inventing an interpretation.
2. Preserve the full meaning — don't drop a condition, exception, or caveat because it's inconvenient to simplify. A shorter, wrong summary is worse than a longer, complete one.
3. Write in plain, direct sentences a busy 17-year-old would actually understand — short sentences, common words, no jargon left unexplained.
4. Separately, pull out any genuinely jargon/bureaucratic terms from the ORIGINAL text (acronyms, legalese, institution-specific terminology) and give each a one-sentence plain definition. If the text has no real jargon, return an empty list — don't invent terms to pad it out.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    plainText: { type: Type.STRING },
    terms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING },
        },
        required: ["term", "definition"],
      },
    },
  },
  required: ["plainText"],
};

export async function generateDebureaucratized(text: string): Promise<DebureaucratizeCallResult> {
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents: text,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 2048,
      },
    });

    const responseText = response.text;
    if (!responseText) return { ok: false, reason: "malformed_response" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return { ok: false, reason: "malformed_response" };
    }

    const validated = DebureaucratizeResultSchema.safeParse(parsed);
    if (!validated.success) return { ok: false, reason: "malformed_response" };

    return { ok: true, data: validated.data };
  } catch (error) {
    return { ok: false, reason: classifyGeminiError(error) };
  }
}
