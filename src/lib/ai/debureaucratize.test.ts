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

import { generateDebureaucratized } from "./debureaucratize";

describe("generateDebureaucratized", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockIsAiConfigured.mockReturnValue(true);
  });

  it("returns not_configured and never calls Gemini when no key is set", async () => {
    mockIsAiConfigured.mockReturnValue(false);
    const result = await generateDebureaucratized("Some formal text.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns malformed_response when Gemini's text isn't valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({ text: "not json" });
    const result = await generateDebureaucratized("Some formal text.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_response");
  });

  it("returns malformed_response when the response is missing plainText", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ terms: [] }) });
    const result = await generateDebureaucratized("Some formal text.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_response");
  });

  it("succeeds with a minimal valid response", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ plainText: "You can apply late if you catch up soon." }) });
    const result = await generateDebureaucratized("Applicants who have not yet satisfied...");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.plainText).toContain("apply late");
  });

  it("classifies a 429 rejection as rate_limited", async () => {
    mockGenerateContent.mockRejectedValue({ status: 429 });
    const result = await generateDebureaucratized("Some formal text.");
    if (!result.ok) expect(result.reason).toBe("rate_limited");
  });

  it("calls Gemini exactly once per request", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ plainText: "ok" }) });
    await generateDebureaucratized("Some formal text.");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
