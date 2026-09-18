"use client";

import { useCallback } from "react";
import type { FactorKey } from "@/lib/engine/types";
import { FIT_WEIGHTS } from "@/lib/engine/weights";
import type { MatchMethod } from "@/lib/engine/personalize";
import { STORAGE_KEYS, useLocalStorageValue } from "./local-storage";

export interface MatchResult {
  method: MatchMethod;
  weights: Record<FactorKey, number>;
  completedAt: string; // ISO date
}

const DEFAULT_RESULT: MatchResult = {
  method: "default",
  weights: FIT_WEIGHTS,
  completedAt: "",
};

/**
 * The weight vector a student arrived at via one of the four /match methods,
 * shared across Recommendations/Compare/Roadmap the same way saved-programs
 * is — write once on /match/*, read everywhere getRecommendations runs.
 */
export function useMatchWeights() {
  const [result, setResult] = useLocalStorageValue<MatchResult>(
    STORAGE_KEYS.matchResult,
    DEFAULT_RESULT,
    DEFAULT_RESULT
  );

  const setMatchResult = useCallback(
    (method: MatchMethod, weights: Record<FactorKey, number>) => {
      setResult({ method, weights, completedAt: new Date().toISOString() });
    },
    [setResult]
  );

  const reset = useCallback(() => setResult(DEFAULT_RESULT), [setResult]);

  return { result, setMatchResult, reset, hasChosenMethod: result.method !== "default" };
}
