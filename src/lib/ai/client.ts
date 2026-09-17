import Anthropic from "@anthropic-ai/sdk";

/**
 * The Claude API key is optional at runtime by design (see docs/AI_USAGE.md):
 * every caller of this module must have a deterministic-template fallback
 * ready, so a missing key degrades the copy quality, not the feature.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!cachedClient) {
    cachedClient = new Anthropic();
  }
  return cachedClient;
}

/** Overridable via env for cost tuning — see docs/AI_USAGE.md for the tradeoff. */
export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
