/**
 * Shared failure taxonomy for every Gemini call site (advisor, rephrase,
 * chat, priority extraction). Never a secondary AI provider — a typed reason
 * plus a status/message log line is the whole error-handling contract.
 */
export type AiFailureReason =
  | "not_configured"
  | "invalid_key"
  | "rate_limited"
  | "api_error"
  | "malformed_response"
  | "network_error";

export function classifyGeminiError(error: unknown): AiFailureReason {
  const status = (error as { status?: unknown } | null)?.status;
  if (status === 401 || status === 403) return "invalid_key";
  if (status === 429) return "rate_limited";
  if (typeof status === "number") return "api_error";
  return "network_error";
}

/** Safe to log: Gemini's own error status/message, never the API key or student data. */
export function logGeminiFailure(tag: string, reason: AiFailureReason, error: unknown): void {
  const status = (error as { status?: unknown } | null)?.status;
  const message = (error as { message?: unknown } | null)?.message;
  console.error(
    `[${tag}] gemini call failed: ${reason} (status=${status ?? "n/a"}) ${typeof message === "string" ? message.slice(0, 300) : ""}`
  );
}
