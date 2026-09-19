"use client";

import { useCallback, useState } from "react";
import type { VibeCheckResult } from "./vibecheck-schema";

type Status = "idle" | "loading" | "error";

interface VibeCheckInput {
  label?: string;
  sources: string;
}

export function useVibeCheck() {
  const [result, setResult] = useState<VibeCheckResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<VibeCheckInput | null>(null);

  const run = useCallback(async (input: VibeCheckInput) => {
    const sources = input.sources.trim();
    if (!sources) return;
    const payload: VibeCheckInput = { sources, label: input.label?.trim() || undefined };
    setLastInput(payload);
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/vibecheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      setResult(data as VibeCheckResult);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach Vibe Check. Check your connection and try again.");
    }
  }, []);

  const retry = useCallback(() => {
    if (lastInput) void run(lastInput);
  }, [lastInput, run]);

  const reset = useCallback(() => {
    setResult(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  return { result, status, errorMessage, check: run, retry, reset };
}
