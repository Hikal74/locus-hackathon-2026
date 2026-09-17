"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ExplainInput {
  universityName: string;
  programName: string;
  country: string;
  whyItFits: string[];
  watchOut: string[];
}

interface ExplainResult {
  whyItFits: string[];
  watchOut: string[];
  source: "ai" | "template";
}

/**
 * Fetches an AI-rephrased version of already-computed recommendation copy,
 * once per distinct set of underlying facts. `fetchOnce` is meant to be called
 * from a UI-expand handler (see RecommendationCard) — it no-ops on repeat calls
 * for the same facts, so re-opening a card doesn't re-fire the request.
 *
 * If the underlying facts change (a What-If edit re-scores this program while
 * its card stays mounted), the cached AI text is invalidated back to null
 * rather than silently shown next to now-stale facts — the caller falls back
 * to displaying the fresh deterministic text until the card is re-expanded,
 * which triggers a fresh fetch instead of firing one automatically on every
 * What-If tweak.
 */
export function useExplain(input: ExplainInput) {
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedSignature = useRef<string | null>(null);

  const signature = JSON.stringify([input.universityName, input.programName, input.whyItFits, input.watchOut]);

  useEffect(() => {
    if (fetchedSignature.current !== null && fetchedSignature.current !== signature) {
      fetchedSignature.current = null;
      setResult(null);
    }
  }, [signature]);

  const fetchOnce = useCallback(() => {
    if (fetchedSignature.current === signature) return;
    fetchedSignature.current = signature;
    setLoading(true);

    fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        universityName: input.universityName,
        programName: input.programName,
        whyItFits: input.whyItFits,
        watchOut: input.watchOut,
      }),
    })
      .then((res) => (res.ok ? (res.json() as Promise<ExplainResult>) : null))
      .then((data) => {
        if (data) setResult(data);
      })
      .catch(() => {
        // Network/API failure — the deterministic template text already on screen stays as-is.
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature captures every field already
  }, [signature]);

  return { result, loading, fetchOnce };
}
