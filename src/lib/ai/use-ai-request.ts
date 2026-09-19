"use client";

import { useCallback, useState } from "react";

type Status = "idle" | "loading" | "error";

/**
 * POSTs JSON to one of our own AI endpoints and tracks loading/error/result, with a retry that replays
 * the last input. Every endpoint returns `{ error: string }` on failure (see the route handlers), so the
 * user sees the server's honest message rather than a generic one.
 */
export function useAiRequest<TInput, TResult>(endpoint: string, unreachableMessage: string) {
  const [result, setResult] = useState<TResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<TInput | null>(null);

  const run = useCallback(
    async (input: TInput) => {
      setLastInput(input);
      setStatus("loading");
      setErrorMessage(null);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data: unknown = await res.json().catch(() => null);

        if (!res.ok || !data || typeof data !== "object") {
          const message =
            data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Something went wrong. Please try again.";
          setStatus("error");
          setErrorMessage(message);
          return;
        }

        setResult(data as TResult);
        setStatus("idle");
      } catch {
        setStatus("error");
        setErrorMessage(unreachableMessage);
      }
    },
    [endpoint, unreachableMessage]
  );

  const retry = useCallback(() => {
    if (lastInput) void run(lastInput);
  }, [lastInput, run]);

  const reset = useCallback(() => {
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  return { result, status, errorMessage, run, retry, reset };
}
