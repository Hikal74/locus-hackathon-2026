import { NextRequest, NextResponse } from "next/server";
import { generateEssayFeedback, type EssayCoachFailureReason } from "@/lib/ai/essaycoach";
import { EssayCoachRequestSchema } from "@/lib/ai/essaycoach-schema";

/**
 * Server-side boundary for Essay Coach. Same honesty contract as the other AI endpoints: a real, typed
 * error on any failure, never a fabricated critique. See docs/AI_USAGE.md.
 */

const ERROR_MESSAGES: Record<EssayCoachFailureReason, { status: number; message: string }> = {
  not_configured: { status: 503, message: "Essay Coach isn't configured on the server yet." },
  invalid_key: { status: 502, message: "Essay Coach is temporarily unavailable. Please try again later." },
  rate_limited: { status: 429, message: "Essay Coach is receiving a lot of requests right now. Please wait a moment and try again." },
  api_error: { status: 502, message: "Couldn't review that draft. Please try again." },
  malformed_response: { status: 502, message: "Essay Coach's response couldn't be understood. Please try again." },
  network_error: { status: 502, message: "Couldn't reach Essay Coach. Check your connection and try again." },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedRequest = EssayCoachRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await generateEssayFeedback(parsedRequest.data);

  if (!result.ok) {
    const { status, message } = ERROR_MESSAGES[result.reason];
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json(result.data);
}
