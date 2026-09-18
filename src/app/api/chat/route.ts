import { NextRequest, NextResponse } from "next/server";
import { generateChatReply, type ChatFailureReason } from "@/lib/ai/chat";
import { ChatRequestSchema } from "@/lib/ai/chat-schema";
import type { StudentProfile } from "@/lib/data/types";

/**
 * Server-side boundary for the always-available advisor drawer's freeform
 * chat tab. Same honesty contract as /api/advisor: a real error is returned
 * on any failure, never a fabricated reply. See docs/AI_USAGE.md.
 */

const ERROR_MESSAGES: Record<ChatFailureReason, { status: number; message: string }> = {
  not_configured: { status: 503, message: "The AI advisor isn't configured on the server yet." },
  invalid_key: { status: 502, message: "The AI advisor is temporarily unavailable. Please try again later." },
  rate_limited: { status: 429, message: "The AI advisor is receiving a lot of requests right now. Please wait a moment and try again." },
  api_error: { status: 502, message: "The AI advisor couldn't answer that. Please try again." },
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

  const parsedRequest = ChatRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    const issues = parsedRequest.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    console.error("[chat] request validation failed:", issues);
    return NextResponse.json({ error: "Invalid request", issues }, { status: 400 });
  }

  const { profile, messages, weights } = parsedRequest.data;

  const result = await generateChatReply({
    profile: profile as StudentProfile | null,
    messages,
    weights,
  });

  if (!result.ok) {
    const { status, message } = ERROR_MESSAGES[result.reason];
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json({ reply: result.reply, sources: result.sources });
}
