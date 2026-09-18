import { beforeEach, describe, expect, it, vi } from "vitest";
import { testProfile } from "@/lib/engine/test-fixtures";

const { mockGenerateContent, mockIsAiConfigured } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockIsAiConfigured: vi.fn(() => true),
}));

vi.mock("./client", () => ({
  isAiConfigured: mockIsAiConfigured,
  getGeminiClient: () => ({ models: { generateContent: mockGenerateContent } }),
  AI_MODEL: "gemini-test-model",
}));

import { generateChatReply } from "./chat";

const oneTurn = [{ role: "user" as const, content: "What's the tuition at MIT?" }];

describe("generateChatReply", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockIsAiConfigured.mockReturnValue(true);
  });

  it("returns not_configured and never calls Gemini when no key is set", async () => {
    mockIsAiConfigured.mockReturnValue(false);
    const result = await generateChatReply({ messages: oneTurn, profile: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns malformed_response when Gemini returns empty text", async () => {
    mockGenerateContent.mockResolvedValue({ text: "" });
    const result = await generateChatReply({ messages: oneTurn, profile: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_response");
  });

  it("classifies a 429 rejection as rate_limited", async () => {
    mockGenerateContent.mockRejectedValue({ status: 429 });
    const result = await generateChatReply({ messages: oneTurn, profile: null });
    if (!result.ok) expect(result.reason).toBe("rate_limited");
  });

  it("works with no profile set (general product questions before onboarding)", async () => {
    mockGenerateContent.mockResolvedValue({ text: "Pathlight scores programs on six factors." });
    const result = await generateChatReply({ messages: [{ role: "user", content: "What is Pathlight?" }], profile: null });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reply).toBe("Pathlight scores programs on six factors.");
  });

  it("surfaces retrieved programs as sources when a profile is supplied", async () => {
    mockGenerateContent.mockResolvedValue({ text: "MIT's CS program is a strong academic match for you." });
    const result = await generateChatReply({ messages: oneTurn, profile: testProfile });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sources.some((s) => s.programId === "mit-cs")).toBe(true);
    }
  });

  it("sends a real multi-turn contents array, not a flattened history string", async () => {
    mockGenerateContent.mockResolvedValue({ text: "ok" });
    await generateChatReply({
      messages: [
        { role: "user", content: "Tell me about NU." },
        { role: "assistant", content: "NU is in Kazakhstan." },
        { role: "user", content: "What's the tuition there?" },
      ],
      profile: null,
    });
    const call = mockGenerateContent.mock.calls[0][0];
    expect(Array.isArray(call.contents)).toBe(true);
    const roles = call.contents.map((c: { role: string }) => c.role);
    expect(roles).toContain("model");
    expect(roles.filter((r: string) => r === "user").length).toBeGreaterThan(1);
  });

  it("calls Gemini exactly once per turn", async () => {
    mockGenerateContent.mockResolvedValue({ text: "ok" });
    await generateChatReply({ messages: oneTurn, profile: null });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
