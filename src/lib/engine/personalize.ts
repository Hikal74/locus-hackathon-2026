import type { FactorKey } from "./types";
import { FIT_WEIGHTS } from "./weights";

export const FACTOR_ORDER: FactorKey[] = [
  "academic",
  "interest",
  "budget",
  "requirements",
  "location",
  "preferences",
];

export const FACTOR_LABELS: Record<FactorKey, string> = {
  academic: "Academic fit",
  interest: "Interest fit",
  budget: "Budget fit",
  requirements: "Requirement readiness",
  location: "Location fit",
  preferences: "Preference fit",
};

export const FACTOR_DESCRIPTIONS: Record<FactorKey, string> = {
  academic: "How your GPA compares to each program's published minimum.",
  interest: "Overlap between what you're into and what the program actually focuses on.",
  budget: "How comfortably the tuition sits under your stated budget.",
  requirements: "How much of the language/exam requirements you've already cleared.",
  location: "How high the university's country sits in your ranked preferences.",
  preferences: "Research emphasis, scholarships, and campus size against what you said you want.",
};

export type MatchMethod = "duels" | "rank" | "map" | "interview" | "default";

/** Smoothing floor so a single lopsided input never zeroes a factor out entirely. */
const MIN_SHARE = 0.04;

/** Clamp to non-negative, apply a smoothing floor, and renormalize so the vector sums to 1. */
export function normalizeWeights(raw: Partial<Record<FactorKey, number>>): Record<FactorKey, number> {
  const floored = FACTOR_ORDER.map((key) => Math.max(MIN_SHARE, raw[key] ?? 0));
  const total = floored.reduce((sum, v) => sum + v, 0);
  const result = {} as Record<FactorKey, number>;
  FACTOR_ORDER.forEach((key, i) => {
    result[key] = total > 0 ? floored[i] / total : FIT_WEIGHTS[key];
  });
  return result;
}

/**
 * Rank-decay weighting: the factor placed first gets the largest share, decaying
 * linearly to the last-placed factor, then normalized. Used by both the Rank
 * method (explicit drag order) and the Interview method (AI-extracted order).
 */
export function weightsFromRanking(order: FactorKey[]): Record<FactorKey, number> {
  const n = FACTOR_ORDER.length;
  const raw: Partial<Record<FactorKey, number>> = {};
  order.forEach((key, index) => {
    raw[key] = n - index;
  });
  return normalizeWeights(raw);
}

/** Tally-based weighting: each duel win adds one vote to its dominant factor. */
export function weightsFromDuelTally(tally: Partial<Record<FactorKey, number>>): Record<FactorKey, number> {
  return normalizeWeights(tally);
}

/** Direct-manipulation weighting: the Fit Map's sliders are the weight vector itself. */
export function weightsFromSliders(sliders: Record<FactorKey, number>): Record<FactorKey, number> {
  return normalizeWeights(sliders);
}
