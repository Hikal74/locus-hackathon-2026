import { NextRequest, NextResponse } from "next/server";
import { extractPriorityOrder, type PriorityFailureReason } from "@/lib/ai/priorities";
import { PriorityRequestSchema } from "@/lib/ai/priorities-schema";

/**
 * Backs the /match/interview method's final step: turns the priorities
 * conversation into a FactorKey order. On any AI failure, the client falls
 * back to a short static quiz — see src/app/match/interview/page.tsx.
 */

const ERROR_MESSAGES: Record<PriorityFailureReason, { status: number; message: string }> = {
  not_configured: { status: 503, message: "The AI advisor isn't configured on the server yet." },
  invalid_key: { status: 502, message: "The AI advisor is temporarily unavailable." },
  rate_limited: { status: 429, message: "The AI advisor is receiving a lot of requests right now." },
  api_error: { status: 502, message: "Couldn't extract your priorities. Please try again." },
  malformed_response: { status: 502, message: "The AI advisor's response couldn't be understood." },
  network_error: { status: 502, message: "Couldn't reach the AI advisor." },
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedRequest = PriorityRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await extractPriorityOrder(parsedRequest.data.conversation);

  if (!result.ok) {
    const { status, message } = ERROR_MESSAGES[result.reason];
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json({ order: result.order });
}
