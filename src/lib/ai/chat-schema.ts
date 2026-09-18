import { z } from "zod";
import { StudentProfileRequestSchema } from "./advisor-schema";

const MAX_MESSAGE_LENGTH = 2000;
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
