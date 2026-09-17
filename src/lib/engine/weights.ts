import type { FactorKey } from "./types";

/**
 * Documented fit-score weights. Sum to 1.0.
 * Changing these changes ranking — keep this the single source of truth
 * so docs/RECOMMENDATION_ENGINE.md can reference it directly instead of
 * duplicating numbers that drift out of sync.
 */
export const FIT_WEIGHTS: Record<FactorKey, number> = {
  academic: 0.25,
  interest: 0.2,
  budget: 0.2,
  requirements: 0.15,
  location: 0.1,
  preferences: 0.1,
};

/** Beyond this multiple of stated budget, no realistic aid path is assumed — hard-excluded rather than merely scored low. */
export const BUDGET_HARD_CEILING_MULTIPLIER = 3;
