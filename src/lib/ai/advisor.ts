import { Type, type Schema } from "@google/genai";
import type { StudentProfile } from "@/lib/data/types";
import { universities, programs } from "@/lib/data/dataset";
import { getGeminiClient, isAiConfigured, AI_MODEL } from "./client";
import { ADVISOR_SYSTEM_INSTRUCTION, buildAdvisorUserMessage } from "./advisor-prompt";
import { retrieveContext, retrievedProgramIds } from "./retrieval";
import { AdvisorAnalysisSchema, type AdvisorAnalysis } from "./advisor-schema";

export type AdvisorFailureReason =
  | "not_configured"
  | "invalid_key"
  | "rate_limited"
  | "api_error"
  | "malformed_response"
  | "network_error";

export interface AdvisorSource {
  programId: string;
  universityName: string;
  programName: string;
  universityWebsiteUrl: string;
}

export interface AdvisorSuccess {
  ok: true;
  analysis: AdvisorAnalysis;
  sources: AdvisorSource[];
  retrievalSummary: { matched: number; totalMatchedInDataset: number; totalExcludedInDataset: number };
}

export type AdvisorResult = AdvisorSuccess | { ok: false; reason: AdvisorFailureReason };

/**
 * Google's structured-output Schema (OpenAPI-3.0 subset — see @google/genai's
 * Schema type). `programId` fields are constrained to an enum of the ids
 * actually retrieved for this request, so the model is structurally unable to
 * emit a citation for a program it wasn't given. sanitizeCitations() below is
 * the second, non-negotiable layer of the same guarantee — app code, not the
 * model's own output, decides what counts as a real source.
 */
function buildResponseSchema(allowedProgramIds: string[]): Schema {
  const idEnum = allowedProgramIds.length > 0 ? allowedProgramIds : ["__no_programs_retrieved__"];
  const programIdField: Schema = { type: Type.STRING, format: "enum", enum: idEnum };

  return {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      profileAnalysis: { type: Type.STRING },
      universityAnalysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            programId: programIdField,
            analysis: { type: Type.STRING },
          },
          required: ["programId", "analysis"],
        },
      },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      developmentAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
      questionsOrMissingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
      verifyBeforeRelying: { type: Type.ARRAY, items: { type: Type.STRING } },
      databaseSourcesUsed: { type: Type.ARRAY, items: programIdField },
    },
    required: ["summary"],
  };
}

function classifyError(error: unknown): AdvisorFailureReason {
  const status = (error as { status?: unknown } | null)?.status;
  if (status === 401 || status === 403) return "invalid_key";
  if (status === 429) return "rate_limited";
  if (typeof status === "number") return "api_error";
  return "network_error";
}

/**
 * Drops any programId in Gemini's JSON that wasn't actually retrieved for
 * this request. The schema enum above already constrains this at generation
 * time; this is the hard guarantee that survives even if a model ever
 * returns something outside its declared schema. See docs/AI_USAGE.md.
 */
function sanitizeCitations(analysis: AdvisorAnalysis, allowedIds: Set<string>): AdvisorAnalysis {
  return {
    ...analysis,
    universityAnalysis: analysis.universityAnalysis?.filter((entry) => allowedIds.has(entry.programId)),
    databaseSourcesUsed: analysis.databaseSourcesUsed?.filter((id) => allowedIds.has(id)),
  };
}

/**
 * The one Gemini call this feature ever makes per user action (initial
 * analysis or follow-up question) — see docs/AI_USAGE.md for why a single
 * well-constructed request is preferred over a multi-call chain.
 */
export async function generateAdvisorAnalysis(params: {
  profile: StudentProfile;
  question?: string;
  history?: { role: "user" | "assistant"; content: string }[];
}): Promise<AdvisorResult> {
  if (!isAiConfigured()) {
    console.error("[advisor] request rejected: GOOGLE_AI_API_KEY not configured");
    return { ok: false, reason: "not_configured" };
  }

  const { profile, question, history } = params;
  console.log("[advisor] request started", { hasQuestion: Boolean(question), historyTurns: history?.length ?? 0 });

  const context = retrieveContext(profile, universities, programs);
  console.log(
    `[advisor] retrieval completed: ${context.matched.length} matched (of ${context.totalMatchedInDataset}), ${context.excludedSample.length} excluded sample (of ${context.totalExcludedInDataset})`
  );

  const allowedIds = retrievedProgramIds(context);
  const allowedIdSet = new Set(allowedIds);

  try {
    const client = getGeminiClient();
    const start = Date.now();
    const response = await client.models.generateContent({
      model: AI_MODEL,
      contents: buildAdvisorUserMessage({ profile, context, history, question }),
      config: {
        systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema(allowedIds),
        maxOutputTokens: 4096,
      },
    });
    console.log(`[advisor] gemini request completed in ${Date.now() - start}ms`);

    const text = response.text;
    if (!text) {
      console.error("[advisor] response validation failed: empty response text");
      return { ok: false, reason: "malformed_response" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("[advisor] response validation failed: not valid JSON");
      return { ok: false, reason: "malformed_response" };
    }

    const validated = AdvisorAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      console.error(`[advisor] response validation failed: shape mismatch (${validated.error.issues.length} issue(s))`);
      return { ok: false, reason: "malformed_response" };
    }
    console.log("[advisor] response validation: ok");

    const analysis = sanitizeCitations(validated.data, allowedIdSet);

    const universityById = new Map(universities.map((u) => [u.id, u]));
    const programById = new Map(programs.map((p) => [p.id, p]));
    const citedIds = new Set([
      ...(analysis.universityAnalysis?.map((e) => e.programId) ?? []),
      ...(analysis.databaseSourcesUsed ?? []),
    ]);
    const sources: AdvisorSource[] = Array.from(citedIds)
      .map((id): AdvisorSource | null => {
        const program = programById.get(id);
        const university = program ? universityById.get(program.universityId) : undefined;
        if (!program || !university) return null;
        return {
          programId: id,
          universityName: university.name,
          programName: program.name,
          universityWebsiteUrl: university.websiteUrl,
        };
      })
      .filter((s): s is AdvisorSource => s != null);

    return {
      ok: true,
      analysis,
      sources,
      retrievalSummary: {
        matched: context.matched.length,
        totalMatchedInDataset: context.totalMatchedInDataset,
        totalExcludedInDataset: context.totalExcludedInDataset,
      },
    };
  } catch (error) {
    const reason = classifyError(error);
    const status = (error as { status?: unknown } | null)?.status;
    const message = (error as { message?: unknown } | null)?.message;
    // Safe to log: Gemini's own error status/message, never the API key or student data.
    console.error(`[advisor] gemini call failed: ${reason} (status=${status ?? "n/a"}) ${typeof message === "string" ? message.slice(0, 300) : ""}`);
    return { ok: false, reason };
  }
}
