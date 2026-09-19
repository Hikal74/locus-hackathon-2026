import { describe, expect, it } from "vitest";
import { DebureaucratizeRequestSchema, DebureaucratizeResultSchema } from "./debureaucratize-schema";

describe("DebureaucratizeRequestSchema", () => {
  it("accepts non-empty text", () => {
    expect(DebureaucratizeRequestSchema.safeParse({ text: "Applicants must submit..." }).success).toBe(true);
  });

  it("rejects empty text", () => {
    expect(DebureaucratizeRequestSchema.safeParse({ text: "" }).success).toBe(false);
  });

  it("rejects text beyond the length cap", () => {
    expect(DebureaucratizeRequestSchema.safeParse({ text: "x".repeat(8001) }).success).toBe(false);
  });
});

describe("DebureaucratizeResultSchema", () => {
  it("accepts a minimal result with only plainText", () => {
    expect(DebureaucratizeResultSchema.safeParse({ plainText: "You can apply late if you finish the test soon after." }).success).toBe(true);
  });

  it("accepts a result with terms", () => {
    const result = DebureaucratizeResultSchema.safeParse({
      plainText: "You can apply late if you finish the test soon after.",
      terms: [{ term: "conditional admission", definition: "You're accepted, but only if you meet one more requirement soon." }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a result missing plainText", () => {
    expect(DebureaucratizeResultSchema.safeParse({ terms: [] }).success).toBe(false);
  });
});
