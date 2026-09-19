"use client";

import { useCallback, useState } from "react";
import type { DebureaucratizeResult } from "./debureaucratize-schema";

type Status = "idle" | "loading" | "error";

export function useDebureaucratize() {
  const [result, setResult] = useState<DebureaucratizeResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastText, setLastText] = useState("");

  const run = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLastText(trimmed);
    setStatus("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/debureaucratize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
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

      setResult(data as DebureaucratizeResult);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the translator. Check your connection and try again.");
    }
  }, []);

  const retry = useCallback(() => {
    if (lastText) void run(lastText);
  }, [lastText, run]);

  return { result, status, errorMessage, translate: run, retry };
}
