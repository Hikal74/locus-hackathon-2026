import { GoogleGenAI } from "@google/genai";

/**
 * The Gemini API key is optional at runtime by design (see docs/AI_USAGE.md):
 * every caller of this module must have a deterministic-template fallback
 * ready, so a missing key degrades the copy quality, not the feature.
 */
export function isAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

let cachedClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  }
  return cachedClient;
}

/**
 * Overridable via env for cost tuning — see docs/AI_USAGE.md for the tradeoff.
 * Shared by both Gemini call sites (rephrasing and the AI advisor). `||`, not
 * `??`: an empty-but-set GEMINI_MODEL (e.g. `GEMINI_MODEL=` in .env.local)
 * must fall back to the default too, and `??` only falls back on null/undefined
 * — this was a real bug caught by a live API call returning "model is
 * required and must be a string". Defaults to a flash-tier model rather than
 * a lite one because the advisor's reasoning task (synthesizing a full
 * profile against multiple database records) needs more than the cheapest
 * tier can reliably deliver — flash-lite risked shallow, generic output
 * there. Confirmed against the live Gemini API on 2026-09-17: verify the
 * default below is still current before relying on it, as available model
 * names change over time — see docs/AI_USAGE.md.
 */
export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
