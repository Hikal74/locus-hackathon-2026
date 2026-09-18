"use client";

import type { FactorKey } from "@/lib/engine/types";
import { FIT_WEIGHTS } from "@/lib/engine/weights";
import { STORAGE_KEYS, useLocalStorageValue } from "./local-storage";

export type MatchMethod = "default";

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
 * The weight vector used by getRecommendations, shared across
 * Recommendations/Compare/Roadmap/Saved the same way saved-programs is.
 * Always the balanced FIT_WEIGHTS default — the four personalized input
 * methods (Duels/Rank/Fit Map/Interview) that used to write into this were
 * removed; this hook is kept as the one place those pages read weights from,
 * in case a personalized method is reintroduced later.
 */
export function useMatchWeights() {
  const [result] = useLocalStorageValue<MatchResult>(STORAGE_KEYS.matchResult, DEFAULT_RESULT, DEFAULT_RESULT);
  return { result };
}
