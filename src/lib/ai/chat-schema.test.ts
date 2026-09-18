import { describe, expect, it } from "vitest";
import { ChatRequestSchema } from "./chat-schema";

describe("ChatRequestSchema", () => {
  it("accepts a null profile with a single short message", () => {
    const result = ChatRequestSchema.safeParse({
      profile: null,
      messages: [{ role: "user", content: "hi" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing profile key (undefined is dropped by JSON.stringify, not the same as null)", () => {
    const result = ChatRequestSchema.safeParse({
      messages: [{ role: "user", content: "hi" }],
    });
    expect(result.success).toBe(false);
  });

  /**
   * Regression test: a real assistant reply from Gemini (capped at
   * maxOutputTokens: 1024 in chat.ts, which can produce several thousand
   * characters) gets echoed back as history on the next turn. If the
   * per-message cap is too tight, that turn permanently 400s every future
   * message in the conversation, since the full history is resent each time.
   */
  it("accepts a long assistant reply within the raised per-message cap", () => {
    const longReply = "x".repeat(6000);
    const result = ChatRequestSchema.safeParse({
      profile: null,
      messages: [
        { role: "assistant", content: longReply },
        { role: "user", content: "follow-up question" },
      ],
    });
    expect(result.success).toBe(true);
  });

  /** Regression test for the exact live bug report: profile.gpaOn4Scale > 4 400'd every chat request. */
  it("clamps an above-range profile GPA instead of rejecting the whole chat request", () => {
    const result = ChatRequestSchema.safeParse({
      profile: {
        intendedField: "computer_science",
        interests: [],
        relevantSubjects: [],
        countryPreferences: ["Kazakhstan"],
        budgetPerYearUSD: 18000,
        languageLevel: {},
        examsCompleted: [],
        intendedIntake: "Fall 2027",
        preferences: {},
        gpaOn4Scale: 4.8,
      },
      messages: [{ role: "user", content: "What is Pathlight?" }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.profile?.gpaOn4Scale).toBe(4);
  });

  it("still rejects a message beyond the per-message cap", () => {
    const tooLong = "x".repeat(8001);
    const result = ChatRequestSchema.safeParse({
      profile: null,
      messages: [{ role: "user", content: tooLong }],
    });
    expect(result.success).toBe(false);
  });
});
