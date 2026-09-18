import { describe, expect, it } from "vitest";
import { FACTOR_ORDER, normalizeWeights, weightsFromDuelTally, weightsFromRanking } from "./personalize";

function sum(weights: Record<string, number>) {
  return Object.values(weights).reduce((a, b) => a + b, 0);
}

describe("normalizeWeights", () => {
  it("sums to 1 for an empty input", () => {
    const weights = normalizeWeights({});
    expect(sum(weights)).toBeCloseTo(1, 5);
  });

  it("never lets a factor collapse to exactly 0", () => {
    const weights = normalizeWeights({ academic: 100 });
    for (const key of FACTOR_ORDER) {
      expect(weights[key]).toBeGreaterThan(0);
    }
  });

  it("sums to 1 for lopsided input", () => {
    const weights = normalizeWeights({ budget: 50, academic: 1 });
    expect(sum(weights)).toBeCloseTo(1, 5);
  });
});

describe("weightsFromRanking", () => {
  it("gives the first-ranked factor the largest share", () => {
    const weights = weightsFromRanking(["budget", "academic", "interest", "location", "requirements", "preferences"]);
    expect(weights.budget).toBeGreaterThan(weights.academic);
    expect(weights.academic).toBeGreaterThan(weights.preferences);
    expect(sum(weights)).toBeCloseTo(1, 5);
  });
});

describe("weightsFromDuelTally", () => {
  it("favors the factor with the most wins", () => {
    const weights = weightsFromDuelTally({ budget: 4, academic: 1 });
    expect(weights.budget).toBeGreaterThan(weights.academic);
    expect(sum(weights)).toBeCloseTo(1, 5);
  });

  it("returns a near-balanced vector for an even tally", () => {
    const evenTally = Object.fromEntries(FACTOR_ORDER.map((k) => [k, 1]));
    const weights = weightsFromDuelTally(evenTally);
    const values = Object.values(weights);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThan(0.01);
  });
});
