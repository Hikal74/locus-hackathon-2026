import type { Program, StudentProfile, University, VerificationStatus } from "@/lib/data/types";
import { academicFit, budgetFit } from "./scoring";

export type Grade = "A" | "B" | "C" | "D" | "F";
export type ReportCardKey = "cost" | "academics" | "campus";

export interface ReportCardEntry {
  key: ReportCardKey;
  label: string;
  /** null = not enough information to grade honestly (shown as "—", never as a guessed letter). */
  grade: Grade | null;
  /** The concrete numbers the grade was computed from. */
  basis: string;
  /** Weakest verification status among the facts this grade depends on. */
  status: VerificationStatus;
}

export function gradeFromScore(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

const STATUS_RANK: Record<VerificationStatus, number> = { verified: 0, needs_verification: 1, demo_data: 2 };

/** A grade is only as trustworthy as its least-trustworthy input. */
export function weakestStatus(statuses: VerificationStatus[]): VerificationStatus {
  return statuses.reduce<VerificationStatus>((worst, s) => (STATUS_RANK[s] > STATUS_RANK[worst] ? s : worst), "verified");
}

/** Monthly living cost -> 0-100. Cheaper is better. */
function livingCostScore(monthlyUSD: number): number {
  if (monthlyUSD <= 400) return 100;
  if (monthlyUSD <= 600) return 80;
  if (monthlyUSD <= 900) return 60;
  if (monthlyUSD <= 1300) return 40;
  return 20;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Niche-style A-F report card, but computed only from Pathlight's own dataset
 * and the student's profile — no scraped reviews and no invented sentiment.
 * Cost and academics reuse the engine's own scoring functions so a grade can
 * never contradict the shortlist's fit factors. Campus life is a simple,
 * transparent rule of thumb (living cost + on-campus housing), and the UI says
 * these are rules of thumb, not review scores.
 */
export function buildReportCard(profile: StudentProfile, program: Program, university: University): ReportCardEntry[] {
  const tuition = program.tuitionPerYearUSD;
  const cost: ReportCardEntry = {
    key: "cost",
    label: "Cost",
    grade: gradeFromScore(budgetFit(profile, program)),
    basis: `Tuition ${usd(tuition.value)}/yr vs your ${usd(profile.budgetPerYearUSD)}/yr budget`,
    status: tuition.status,
  };

  const min = program.minGpaOn4Scale;
  const canGradeAcademics = profile.gpaOn4Scale != null && min != null;
  const academics: ReportCardEntry = {
    key: "academics",
    label: "Academic fit",
    grade: canGradeAcademics ? gradeFromScore(academicFit(profile, program)) : null,
    basis: canGradeAcademics
      ? `Your GPA ${profile.gpaOn4Scale!.toFixed(1)} vs published minimum ${min!.value.toFixed(1)}`
      : profile.gpaOn4Scale == null
        ? "Add your GPA to grade this"
        : "No published GPA minimum in our data",
    status: min?.status ?? "needs_verification",
  };

  const life = university.campusLife;
  let campus: ReportCardEntry;
  if (!life) {
    campus = { key: "campus", label: "Campus life", grade: null, basis: "No campus-life data for this university yet", status: "needs_verification" };
  } else {
    const monthly = life.costOfLivingPerMonthUSD;
    const housing = life.onCampusHousing.available;
    const score = Math.round(livingCostScore(monthly.value) * 0.7 + (housing ? 100 : 40) * 0.3);
    campus = {
      key: "campus",
      label: "Campus life",
      grade: gradeFromScore(score),
      basis: `Living ~${usd(monthly.value)}/mo; on-campus housing ${housing ? "available" : "not available"}`,
      status: weakestStatus([monthly.status, life.onCampusHousing.priceRangePerYearUSD?.status ?? monthly.status]),
    };
  }

  return [cost, academics, campus];
}
