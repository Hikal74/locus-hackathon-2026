import { NextRequest, NextResponse } from "next/server";
import { generateAdvisorAnalysis, type AdvisorFailureReason } from "@/lib/ai/advisor";
import { AdvisorRequestSchema } from "@/lib/ai/advisor-schema";
import type { StudentProfile } from "@/lib/data/types";

/**
 * Server-side boundary for the AI advisor. Validates the request shape with
 * Zod, retrieves grounded database context, calls Gemini exactly once, and
 * returns either the real analysis or a typed, handled error — NEVER a
 * deterministic-template answer dressed up as an AI response. See
 * docs/AI_USAGE.md "No static fallback" for why that distinction matters.
 */

const ERROR_MESSAGES: Record<AdvisorFailureReason, { status: number; message: string }> = {
  not_configured: { status: 503, message: "The AI advisor isn't configured on the server yet." },
  invalid_key: { status: 502, message: "The AI advisor is temporarily unavailable. Please try again later." },
  rate_limited: { status: 429, message: "The AI advisor is receiving a lot of requests right now. Please wait a moment and try again." },
  api_error: { status: 502, message: "The AI advisor couldn't complete your analysis. Please try again." },
  malformed_response: { status: 502, message: "The AI advisor's response couldn't be understood. Please try again." },
  network_error: { status: 502, message: "Couldn't reach the AI advisor. Check your connection and try again." },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedRequest = AdvisorRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const issues = parsedRequest.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    console.error("[advisor] request validation failed:", issues);
    return NextResponse.json({ error: "Invalid request", issues }, { status: 400 });
  }

  const { profile, question, history } = parsedRequest.data;

  const result = await generateAdvisorAnalysis({
    // Zod's inferred type is structurally compatible with StudentProfile but
    // not nominally identical (e.g. languageLevel's key type) — safe to widen here.
    profile: profile as StudentProfile,
    question,
    history,
  });

  if (!result.ok) {
    const { status, message } = ERROR_MESSAGES[result.reason];
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json({
    analysis: result.analysis,
    sources: result.sources,
    retrievalSummary: result.retrievalSummary,
  });
}
