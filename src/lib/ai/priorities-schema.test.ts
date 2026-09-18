import { describe, expect, it } from "vitest";
import { PriorityRequestSchema } from "./priorities-schema";

describe("PriorityRequestSchema", () => {
  it("accepts a normal short conversation", () => {
    const result = PriorityRequestSchema.safeParse({
      conversation: [
        { role: "assistant", content: "What matters most to you?" },
        { role: "user", content: "Cost, mostly." },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty conversation", () => {
    const result = PriorityRequestSchema.safeParse({ conversation: [] });
    expect(result.success).toBe(false);
  });

  /**
   * Regression test: /match/interview sends real, non-schema-constrained
   * Gemini follow-up questions (from /api/chat) as part of this conversation.
   * A cap too tight here breaks the extraction step after a verbose AI turn —
   * same bug class as chat-schema.test.ts and advisor-schema.test.ts.
   */
  it("accepts a long AI-generated turn within the raised per-turn cap", () => {
    const result = PriorityRequestSchema.safeParse({
      conversation: [{ role: "assistant", content: "x".repeat(6000) }],
    });
    expect(result.success).toBe(true);
  });

  it("still rejects a turn beyond the per-turn cap", () => {
    const result = PriorityRequestSchema.safeParse({
      conversation: [{ role: "assistant", content: "x".repeat(8001) }],
    });
    expect(result.success).toBe(false);
  });
});
