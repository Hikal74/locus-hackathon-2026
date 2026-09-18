import { z } from "zod";

const MAX_TURN_LENGTH = 2000;
const MAX_TURNS = 24;

export const PriorityRequestSchema = z.object({
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_TURN_LENGTH),
      })
    )
    .min(1)
    .max(MAX_TURNS),
});

export type PriorityRequest = z.infer<typeof PriorityRequestSchema>;
