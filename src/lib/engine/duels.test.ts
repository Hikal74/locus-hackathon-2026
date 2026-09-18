import { describe, expect, it } from "vitest";
import { generateDuels } from "./duels";
import { FACTOR_ORDER } from "./personalize";
import { testProfile, testProgram, testUniversity } from "./test-fixtures";

const otherUniversity = { ...testUniversity, id: "other-uni", name: "Other University" };
const otherProgram = {
  ...testProgram,
  id: "other-cs",
  universityId: "other-uni",
  tuitionPerYearUSD: { value: 8000, status: "verified" as const },
  minGpaOn4Scale: { value: 3.0, status: "demo_data" as const },
  selectivity: "moderate" as const,
};

describe("generateDuels", () => {
  it("returns no duels when fewer than two eligible programs exist", () => {
    expect(generateDuels(testProfile, [testUniversity], [testProgram])).toHaveLength(0);
  });

  it("never pairs a program against itself", () => {
    const duels = generateDuels(testProfile, [testUniversity, otherUniversity], [testProgram, otherProgram]);
    for (const duel of duels) {
      expect(duel.left.program.id).not.toBe(duel.right.program.id);
    }
  });

  it("only includes programs matching the student's intended field", () => {
    const offField = { ...otherProgram, id: "off-field", field: "business" as const };
    const duels = generateDuels(testProfile, [testUniversity, otherUniversity], [testProgram, offField]);
    expect(duels).toHaveLength(0);
  });

  it("tags each duel with a valid factor key", () => {
    const duels = generateDuels(testProfile, [testUniversity, otherUniversity], [testProgram, otherProgram]);
    for (const duel of duels) {
      expect(FACTOR_ORDER).toContain(duel.factor);
    }
  });

  it("gives each side plain, non-score facts", () => {
    const duels = generateDuels(testProfile, [testUniversity, otherUniversity], [testProgram, otherProgram]);
    for (const duel of duels) {
      expect(duel.left.facts.length).toBeGreaterThan(0);
      expect(duel.right.facts.length).toBeGreaterThan(0);
    }
  });
});
