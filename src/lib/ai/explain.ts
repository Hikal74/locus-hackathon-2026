import { Type } from "@google/genai";
import { getGeminiClient, isAiConfigured, AI_MODEL } from "./client";
import { classifyGeminiError, type AiFailureReason } from "./errors";

export interface ExplanationFacts {
  universityName: string;
  programName: string;
  whyItFits: string[];
  watchOut: string[];
}

export type RephraseFailureReason = AiFailureReason;

export type RephraseResult =
  | { ok: true; data: ExplanationFacts }
  | { ok: false; reason: RephraseFailureReason };

const SYSTEM_INSTRUCTION = `You rewrite short factual bullet points about a university program match for a student, in a warmer, more natural tone.

Rules, strictly enforced:
1. You may ONLY rephrase the facts given to you. Never add a new fact, number, requirement, reason, or claim that isn't already present in the input.
2. Preserve the same number of bullets in each list, in the same order, with the same meaning.
3. Keep each bullet to one short sentence.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    whyItFits: { type: Type.ARRAY, items: { type: Type.STRING } },
    watchOut: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["whyItFits", "watchOut"],
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Rephrases already-computed, fact-checked bullet points via Gemini. Never falls
 * back to a different AI provider on failure — it returns a typed reason so the
 * caller can log it, and always has the deterministic template text as a ready,
 * non-AI fallback for the UI. See docs/AI_USAGE.md.
 */
export async function rephraseExplanation(facts: ExplanationFacts): Promise<RephraseResult> {
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents: JSON.stringify({
        university: facts.universityName,
        program: facts.programName,
        whyItFits: facts.whyItFits,
        watchOut: facts.watchOut,
      }),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 1024,
      },
    });

    const text = response.text;
    if (!text) return { ok: false, reason: "malformed_response" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, reason: "malformed_response" };
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !isStringArray((parsed as Record<string, unknown>).whyItFits) ||
      !isStringArray((parsed as Record<string, unknown>).watchOut)
    ) {
      return { ok: false, reason: "malformed_response" };
    }

    return {
      ok: true,
      data: {
        universityName: facts.universityName,
        programName: facts.programName,
        whyItFits: (parsed as { whyItFits: string[] }).whyItFits,
        watchOut: (parsed as { watchOut: string[] }).watchOut,
      },
    };
  } catch (error) {
    return { ok: false, reason: classifyGeminiError(error) };
  }
}
