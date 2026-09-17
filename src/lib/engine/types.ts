import type { Program, University } from "@/lib/data/types";

export type FactorKey =
  | "academic"
  | "interest"
  | "location"
  | "budget"
  | "requirements"
  | "preferences";

export interface FactorScore {
  key: FactorKey;
  label: string;
  score: number; // 0-100
}

export interface Recommendation {
  program: Program;
  university: University;
  fitScore: number; // 0-100, weighted sum of factors — a preference match, NOT an admission probability
  factors: FactorScore[];
  whyItFits: string[];
  watchOut: string[];
}

export interface FilteredOutOption {
  program: Program;
  university: University;
  reason: string;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  excluded: FilteredOutOption[];
}
