import { NextRequest, NextResponse } from "next/server";
import { generateDebureaucratized, type DebureaucratizeFailureReason } from "@/lib/ai/debureaucratize";
import { DebureaucratizeRequestSchema } from "@/lib/ai/debureaucratize-schema";

/**
 * Server-side boundary for the De-Bureaucratizer. Same honesty contract as
 * /api/chat and /api/advisor: a real, typed error on any failure, never a
 * fabricated translation. See docs/AI_USAGE.md.
 */

const ERROR_MESSAGES: Record<DebureaucratizeFailureReason, { status: number; message: string }> = {
  not_configured: { status: 503, message: "The translator isn't configured on the server yet." },
  invalid_key: { status: 502, message: "The translator is temporarily unavailable. Please try again later." },
  rate_limited: { status: 429, message: "The translator is receiving a lot of requests right now. Please wait a moment and try again." },
  api_error: { status: 502, message: "Couldn't translate that. Please try again." },
  malformed_response: { status: 502, message: "The translator's response couldn't be understood. Please try again." },
  network_error: { status: 502, message: "Couldn't reach the translator. Check your connection and try again." },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedRequest = DebureaucratizeRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await generateDebureaucratized(parsedRequest.data.text);

  if (!result.ok) {
    const { status, message } = ERROR_MESSAGES[result.reason];
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json(result.data);
}
