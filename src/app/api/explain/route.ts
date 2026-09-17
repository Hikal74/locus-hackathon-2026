import { NextRequest, NextResponse } from "next/server";
import { rephraseExplanation } from "@/lib/ai/explain";

interface ExplainRequestBody {
  universityName?: unknown;
  programName?: unknown;
  whyItFits?: unknown;
  watchOut?: unknown;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Rephrases already-computed recommendation copy via Claude. The client always
 * sends the deterministic template text as input; on any failure this returns
 * that same text back with source: "template" so the UI never breaks. See
 * docs/AI_USAGE.md.
 */
export async function POST(request: NextRequest) {
  let body: ExplainRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { universityName, programName, whyItFits, watchOut } = body;
  if (
    typeof universityName !== "string" ||
    typeof programName !== "string" ||
    !isStringArray(whyItFits) ||
    !isStringArray(watchOut)
  ) {
    return NextResponse.json({ error: "universityName, programName must be strings; whyItFits, watchOut must be string arrays" }, { status: 400 });
  }

  const rephrased = await rephraseExplanation({ universityName, programName, whyItFits, watchOut });

  if (!rephrased) {
    return NextResponse.json({ whyItFits, watchOut, source: "template" });
  }

  return NextResponse.json({ whyItFits: rephrased.whyItFits, watchOut: rephrased.watchOut, source: "ai" });
}
