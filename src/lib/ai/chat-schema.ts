import { z } from "zod";
import { StudentProfileRequestSchema } from "./advisor-schema";

// Bounds a single turn's length. User-typed questions are always short, but this also
// has to cover Gemini's own replies echoed back as history on the next turn — those are
// capped at maxOutputTokens: 1024 server-side (chat.ts), which can produce several
// thousand characters of English prose, so this needs real headroom above 1024 tokens'
// worth of characters, not just "long enough for a typed question." A cap that's too
// tight here causes every future turn in the conversation to 400 once one reply crosses
// it, since the full history is resent each turn — a real bug this was fixed after hitting.
const MAX_MESSAGE_LENGTH = 8000;
const MAX_MESSAGES = 30;

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(MAX_MESSAGE_LENGTH),
});

/** Request contract for POST /api/chat — the always-available advisor drawer's freeform tab. */
export const ChatRequestSchema = z.object({
  profile: StudentProfileRequestSchema.nullable(),
  messages: z.array(ChatMessageSchema).min(1).max(MAX_MESSAGES),
  weights: z.record(z.string(), z.number()).optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
