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
 * Rephrases already-computed recommendation copy via Gemini. The client always
 * sends the deterministic template text as input; on any failure (missing key,
 * invalid key, rate limit, malformed response, network error — never by falling
 * back to a different AI provider) this returns that same text back with
 * source: "template" so the UI never breaks. See docs/AI_USAGE.md.
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

  const result = await rephraseExplanation({ universityName, programName, whyItFits, watchOut });

  if (!result.ok) {
    if (result.reason !== "not_configured") {
      console.error(`[gemini] rephraseExplanation failed: ${result.reason}`);
    }
    return NextResponse.json({ whyItFits, watchOut, source: "template" });
  }

  return NextResponse.json({ whyItFits: result.data.whyItFits, watchOut: result.data.watchOut, source: "ai" });
}
