import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateContent, mockIsAiConfigured } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockIsAiConfigured: vi.fn(() => true),
}));

vi.mock("./client", () => ({
  isAiConfigured: mockIsAiConfigured,
  getGeminiClient: () => ({ models: { generateContent: mockGenerateContent } }),
  AI_MODEL: "gemini-test-model",
}));

import { extractPriorityOrder } from "./priorities";

const conversation = [
  { role: "assistant" as const, content: "What matters most to you?" },
  { role: "user" as const, content: "Cost is my biggest concern, then how good the program is." },
];

describe("extractPriorityOrder", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockIsAiConfigured.mockReturnValue(true);
  });

  it("returns not_configured when no key is set", async () => {
    mockIsAiConfigured.mockReturnValue(false);
    const result = await extractPriorityOrder(conversation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
  });

  it("returns a complete 6-factor order from a partial model response", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ order: ["budget", "academic"] }) });
    const result = await extractPriorityOrder(conversation);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.order).toHaveLength(6);
      expect(new Set(result.order).size).toBe(6);
      expect(result.order[0]).toBe("budget");
      expect(result.order[1]).toBe("academic");
    }
  });

  it("dedupes a response with a repeated factor", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ order: ["budget", "budget", "location"] }) });
    const result = await extractPriorityOrder(conversation);
    expect(result.ok).toBe(true);
    if (result.ok) expect(new Set(result.order).size).toBe(6);
  });

  it("returns malformed_response when the order field is missing", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({}) });
    const result = await extractPriorityOrder(conversation);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_response");
  });
});
