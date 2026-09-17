import { getAnthropicClient, isAiConfigured, AI_MODEL } from "./client";

export interface ExplanationFacts {
  universityName: string;
  programName: string;
  whyItFits: string[];
  watchOut: string[];
}

const SYSTEM_PROMPT = `You rewrite short factual bullet points about a university program match for a student, in a warmer, more natural tone.

Rules, strictly enforced:
1. You may ONLY rephrase the facts given to you. Never add a new fact, number, requirement, reason, or claim that isn't already present in the input.
2. Preserve the same number of bullets in each list, in the same order, with the same meaning.
3. Keep each bullet to one short sentence.
4. Output ONLY a JSON object of this exact shape, with no markdown code fences and no commentary: {"whyItFits": string[], "watchOut": string[]}`;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Rephrases already-computed, fact-checked bullet points via Claude. Returns null
 * on ANY failure (no key configured, network error, malformed response) — the
 * caller always has the deterministic template text as a ready fallback, so a
 * null here should never surface as a broken UI. See docs/AI_USAGE.md.
 */
export async function rephraseExplanation(facts: ExplanationFacts): Promise<ExplanationFacts | null> {
  if (!isAiConfigured()) return null;

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            university: facts.universityName,
            program: facts.programName,
            whyItFits: facts.whyItFits,
            watchOut: facts.watchOut,
          }),
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const parsed: unknown = JSON.parse(textBlock.text);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("whyItFits" in parsed) ||
      !("watchOut" in parsed) ||
      !isStringArray((parsed as Record<string, unknown>).whyItFits) ||
      !isStringArray((parsed as Record<string, unknown>).watchOut)
    ) {
      return null;
    }

    return {
      universityName: facts.universityName,
      programName: facts.programName,
      whyItFits: (parsed as { whyItFits: string[] }).whyItFits,
      watchOut: (parsed as { watchOut: string[] }).watchOut,
    };
  } catch {
    return null;
  }
}
