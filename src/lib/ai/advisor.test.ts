import { beforeEach, describe, expect, it, vi } from "vitest";
import { testProfile } from "@/lib/engine/test-fixtures";

const { mockGenerateContent, mockIsAiConfigured } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockIsAiConfigured: vi.fn(() => true),
}));

// Mocked at the module boundary advisor.ts actually imports ("./client", resolved
// relative to this file — same target) so no real network/API-key logic runs.
vi.mock("./client", () => ({
  isAiConfigured: mockIsAiConfigured,
  getGeminiClient: () => ({ models: { generateContent: mockGenerateContent } }),
  AI_MODEL: "gemini-test-model",
}));

// vi.mock calls above are hoisted by Vitest above this import, so `generateAdvisorAnalysis`
// sees the mocked "./client" module.
import { generateAdvisorAnalysis } from "./advisor";

describe("generateAdvisorAnalysis", () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
    mockIsAiConfigured.mockReturnValue(true);
  });

  it("returns not_configured and never calls Gemini when no key is set", async () => {
    mockIsAiConfigured.mockReturnValue(false);
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not_configured");
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("returns malformed_response when Gemini's text isn't valid JSON", async () => {
    mockGenerateContent.mockResolvedValue({ text: "this is not json" });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_response");
  });

  it("returns malformed_response when the JSON is missing the required summary field", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ strengths: ["x"] }) });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_response");
  });

  it("returns malformed_response when Gemini returns an empty response", async () => {
    mockGenerateContent.mockResolvedValue({ text: "" });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed_response");
  });

  it("classifies a 429 rejection as rate_limited", async () => {
    mockGenerateContent.mockRejectedValue({ status: 429 });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    if (!result.ok) expect(result.reason).toBe("rate_limited");
  });

  it("classifies a 401 rejection as invalid_key", async () => {
    mockGenerateContent.mockRejectedValue({ status: 401 });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    if (!result.ok) expect(result.reason).toBe("invalid_key");
  });

  it("classifies a rejection with no status (e.g. connectivity failure) as network_error", async () => {
    mockGenerateContent.mockRejectedValue(new Error("fetch failed"));
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    if (!result.ok) expect(result.reason).toBe("network_error");
  });

  it("drops a hallucinated programId that wasn't in the retrieved set, rather than trusting it", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        summary: "Test summary.",
        universityAnalysis: [{ programId: "totally-made-up-id", analysis: "x" }],
        databaseSourcesUsed: ["totally-made-up-id", "another-fake-one"],
      }),
    });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.analysis.universityAnalysis).toEqual([]);
      expect(result.analysis.databaseSourcesUsed).toEqual([]);
      expect(result.sources).toEqual([]);
    }
  });

  it("keeps a real, retrieved programId and attaches its actual university/program name as a source", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({
        summary: "Test summary.",
        universityAnalysis: [{ programId: "mit-cs", analysis: "Strong fit because of X." }],
        databaseSourcesUsed: ["mit-cs"],
      }),
    });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.analysis.universityAnalysis).toEqual([{ programId: "mit-cs", analysis: "Strong fit because of X." }]);
      expect(result.sources.some((s) => s.programId === "mit-cs" && s.universityName === "Massachusetts Institute of Technology")).toBe(true);
    }
  });

  it("succeeds with a minimal valid response containing only summary", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ summary: "Looks solid overall." }) });
    const result = await generateAdvisorAnalysis({ profile: testProfile });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.analysis.summary).toBe("Looks solid overall.");
  });

  it("calls Gemini exactly once per request (no multi-call chain)", async () => {
    mockGenerateContent.mockResolvedValue({ text: JSON.stringify({ summary: "ok" }) });
    await generateAdvisorAnalysis({ profile: testProfile, question: "What about China?" });
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});
