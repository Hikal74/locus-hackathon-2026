import { Type } from "@google/genai";
import type { FactorKey } from "@/lib/engine/types";
import { FACTOR_ORDER } from "@/lib/engine/personalize";
import { getGeminiClient, isAiConfigured, AI_MODEL } from "./client";
import { classifyGeminiError, type AiFailureReason } from "./errors";

export type PriorityFailureReason = AiFailureReason;
export type PriorityResult = { ok: true; order: FactorKey[] } | { ok: false; reason: PriorityFailureReason };

/**
 * Single schema-constrained call that turns a short priorities conversation
 * (the /match/interview method) into a FactorKey order — the AI extracts a
 * stated preference, it never invents or scores anything the deterministic
 * engine owns. Same one-call, JSON-schema-constrained pattern as explain.ts.
 */
const SYSTEM_INSTRUCTION = `You read a short conversation between an admissions advisor and a student about what matters most to them when choosing where to study. Extract the six named factors, ordered from most to least important to THIS student, based only on what they actually said — never guess wildly if something wasn't discussed, just keep undiscussed factors in a reasonable default order.

Factors:
- academic: how competitive/selective the program's admissions bar is
- interest: how well the program's actual content matches what they want to study
- budget: tuition cost
- requirements: how ready they already are for the language/exam requirements
- location: which country/place they'd rather be
- preferences: research emphasis, scholarship availability, campus size`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    order: {
      type: Type.ARRAY,
      items: { type: Type.STRING, format: "enum", enum: FACTOR_ORDER },
    },
  },
  required: ["order"],
};

export async function extractPriorityOrder(
  conversation: { role: "user" | "assistant"; content: string }[]
): Promise<PriorityResult> {
  if (!isAiConfigured()) return { ok: false, reason: "not_configured" };

  const transcript = conversation.map((t) => `${t.role === "user" ? "Student" : "Advisor"}: ${t.content}`).join("\n");

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents: `Conversation transcript:\n${transcript}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 256,
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

    const order = (parsed as { order?: unknown } | null)?.order;
    if (!Array.isArray(order)) return { ok: false, reason: "malformed_response" };

    const valid = order.filter((k): k is FactorKey => FACTOR_ORDER.includes(k as FactorKey));
    const deduped = Array.from(new Set(valid));
    const complete = [...deduped, ...FACTOR_ORDER.filter((k) => !deduped.includes(k))];

    return { ok: true, order: complete };
  } catch (error) {
    return { ok: false, reason: classifyGeminiError(error) };
  }
}
