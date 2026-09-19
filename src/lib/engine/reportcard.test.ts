import { describe, expect, it } from "vitest";
import { buildReportCard, gradeFromScore, weakestStatus } from "./reportcard";
import { budgetFit, academicFit } from "./scoring";
import { testProfile, testProgram, testUniversity } from "./test-fixtures";
import type { CampusLife, University } from "@/lib/data/types";

const campusLife = (monthly: number, housing: boolean, status: "verified" | "needs_verification" | "demo_data" = "verified"): CampusLife => ({
  costOfLivingPerMonthUSD: { value: monthly, status },
  onCampusHousing: { available: housing },
  offCampusHousingNote: "n/a",
  neighborhoodNote: "n/a",
  socialClimateNote: "n/a",
});

const uniWith = (life?: CampusLife): University => ({ ...testUniversity, campusLife: life });

describe("gradeFromScore", () => {
  it("maps score bands to letters at the boundaries", () => {
    expect(gradeFromScore(100)).toBe("A");
    expect(gradeFromScore(85)).toBe("A");
    expect(gradeFromScore(84)).toBe("B");
    expect(gradeFromScore(70)).toBe("B");
    expect(gradeFromScore(69)).toBe("C");
    expect(gradeFromScore(55)).toBe("C");
    expect(gradeFromScore(54)).toBe("D");
    expect(gradeFromScore(40)).toBe("D");
    expect(gradeFromScore(39)).toBe("F");
  });
});

describe("weakestStatus", () => {
  it("returns the least-trustworthy status", () => {
    expect(weakestStatus(["verified", "verified"])).toBe("verified");
    expect(weakestStatus(["verified", "needs_verification"])).toBe("needs_verification");
    expect(weakestStatus(["needs_verification", "demo_data", "verified"])).toBe("demo_data");
  });
});

describe("buildReportCard", () => {
  it("returns cost, academics, and campus entries in order", () => {
    const card = buildReportCard(testProfile, testProgram, uniWith(campusLife(500, true)));
    expect(card.map((c) => c.key)).toEqual(["cost", "academics", "campus"]);
  });

  it("derives cost and academics grades from the engine's own scoring functions", () => {
    const card = buildReportCard(testProfile, testProgram, uniWith());
    expect(card[0].grade).toBe(gradeFromScore(budgetFit(testProfile, testProgram)));
    expect(card[1].grade).toBe(gradeFromScore(academicFit(testProfile, testProgram)));
  });

  it("shows the numbers a grade is based on", () => {
    const card = buildReportCard(testProfile, testProgram, uniWith(campusLife(500, true)));
    expect(card[0].basis).toBe("Tuition $20,000/yr vs your $25,000/yr budget");
    expect(card[1].basis).toBe("Your GPA 3.8 vs published minimum 3.5");
    expect(card[2].basis).toBe("Living ~$500/mo; on-campus housing available");
  });

  it("carries the tuition fact's verification status on the cost grade", () => {
    const card = buildReportCard(testProfile, testProgram, uniWith());
    expect(card[0].status).toBe("verified");
  });

  it("leaves academics ungraded (null) without a GPA, instead of guessing", () => {
    const card = buildReportCard({ ...testProfile, gpaOn4Scale: undefined }, testProgram, uniWith());
    expect(card[1].grade).toBeNull();
    expect(card[1].basis).toMatch(/add your gpa/i);
  });

  it("leaves academics ungraded when the program has no published minimum", () => {
    const card = buildReportCard(testProfile, { ...testProgram, minGpaOn4Scale: undefined }, uniWith());
    expect(card[1].grade).toBeNull();
    expect(card[1].basis).toMatch(/no published gpa minimum/i);
  });

  it("leaves campus life ungraded when the university has no campus data", () => {
    const card = buildReportCard(testProfile, testProgram, uniWith());
    expect(card[2].grade).toBeNull();
  });

  it("grades a cheap campus with on-campus housing higher than an expensive one without", () => {
    const cheap = buildReportCard(testProfile, testProgram, uniWith(campusLife(400, true)))[2];
    const pricey = buildReportCard(testProfile, testProgram, uniWith(campusLife(1500, false)))[2];
    expect(cheap.grade).toBe("A");
    expect(pricey.grade).toBe("F");
  });

  it("downgrades the campus grade's status to the weakest input", () => {
    const life: CampusLife = {
      ...campusLife(500, true, "verified"),
      onCampusHousing: { available: true, priceRangePerYearUSD: { value: [1000, 2000], status: "demo_data" } },
    };
    expect(buildReportCard(testProfile, testProgram, uniWith(life))[2].status).toBe("demo_data");
  });
});
