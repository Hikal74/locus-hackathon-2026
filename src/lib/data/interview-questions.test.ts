import { describe, expect, it } from "vitest";
import { getInterviewQuestions } from "./interview-questions";
import type { FieldOfStudy } from "./types";

const FIELDS: FieldOfStudy[] = ["computer_science", "business", "engineering", "medicine", "natural_sciences", "humanities", "arts"];

describe("getInterviewQuestions", () => {
  it("returns only the general set when no field is known", () => {
    const questions = getInterviewQuestions();
    expect(questions.length).toBeGreaterThanOrEqual(6);
    expect(questions.every((q) => !q.id.startsWith("field-"))).toBe(true);
  });

  it("puts a field-specific question first for every field of study", () => {
    for (const field of FIELDS) {
      const questions = getInterviewQuestions(field);
      expect(questions[0].id.startsWith("field-")).toBe(true);
    }
  });

  it("has unique ids and non-empty text and guidance throughout", () => {
    for (const field of [undefined, ...FIELDS]) {
      const questions = getInterviewQuestions(field);
      expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
      for (const q of questions) {
        expect(q.question.trim()).not.toBe("");
        expect(q.lookFor.trim()).not.toBe("");
      }
    }
  });
});
