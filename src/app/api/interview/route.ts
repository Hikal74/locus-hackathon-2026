import { NextRequest, NextResponse } from "next/server";
import { generateInterviewFeedback, type InterviewFailureReason } from "@/lib/ai/interview";
import { InterviewRequestSchema } from "@/lib/ai/interview-schema";

/**
 * Server-side boundary for interview practice. Same honesty contract as the other AI endpoints: a real,
 * typed error on any failure, never fabricated feedback. See docs/AI_USAGE.md.
 */

const ERROR_MESSAGES: Record<InterviewFailureReason, { status: number; message: string }> = {
  not_configured: { status: 503, message: "Interview practice isn't configured on the server yet." },
  invalid_key: { status: 502, message: "Interview practice is temporarily unavailable. Please try again later." },
  rate_limited: { status: 429, message: "Interview practice is receiving a lot of requests right now. Please wait a moment and try again." },
  api_error: { status: 502, message: "Couldn't review that answer. Please try again." },
  malformed_response: { status: 502, message: "The feedback couldn't be understood. Please try again." },
  network_error: { status: 502, message: "Couldn't reach interview practice. Check your connection and try again." },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedRequest = InterviewRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await generateInterviewFeedback(parsedRequest.data);

  if (!result.ok) {
    const { status, message } = ERROR_MESSAGES[result.reason];
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json(result.data);
}
