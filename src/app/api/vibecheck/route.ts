import { NextRequest, NextResponse } from "next/server";
import { generateVibeCheck, type VibeCheckFailureReason } from "@/lib/ai/vibecheck";
import { VibeCheckRequestSchema } from "@/lib/ai/vibecheck-schema";

/**
 * Server-side boundary for Professor Vibe Check. Same honesty contract as
 * /api/chat and /api/debureaucratize: a real, typed error on any failure, never
 * a fabricated summary. See docs/AI_USAGE.md.
 */

const ERROR_MESSAGES: Record<VibeCheckFailureReason, { status: number; message: string }> = {
  not_configured: { status: 503, message: "Vibe Check isn't configured on the server yet." },
  invalid_key: { status: 502, message: "Vibe Check is temporarily unavailable. Please try again later." },
  rate_limited: { status: 429, message: "Vibe Check is receiving a lot of requests right now. Please wait a moment and try again." },
  api_error: { status: 502, message: "Couldn't read those sources. Please try again." },
  malformed_response: { status: 502, message: "Vibe Check's response couldn't be understood. Please try again." },
  network_error: { status: 502, message: "Couldn't reach Vibe Check. Check your connection and try again." },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedRequest = VibeCheckRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await generateVibeCheck(parsedRequest.data);

  if (!result.ok) {
    const { status, message } = ERROR_MESSAGES[result.reason];
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json(result.data);
}
