import type { Recommendation } from "./types";

export type SortKey = "fit" | "tuition" | "deadline";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "fit", label: "Best fit" },
  { value: "tuition", label: "Lowest tuition" },
  { value: "deadline", label: "Nearest deadline" },
];

const FAR_FUTURE = "9999-12-31";

/** Soonest deadline that hasn't passed; programs with none sort last. Without `todayIso`, every date counts. */
function nextDeadlineDate(rec: Recommendation, todayIso?: string): string {
  const dates = rec.program.deadlines.map((d) => d.date).filter((d) => todayIso === undefined || d >= todayIso);
  return dates.length === 0 ? FAR_FUTURE : dates.reduce((min, d) => (d < min ? d : min));
}

/** Returns a new array; the engine's own ordering is never mutated. Fit score breaks ties for every key. */
export function sortRecommendations(recs: Recommendation[], key: SortKey, todayIso?: string): Recommendation[] {
  const byFit = (a: Recommendation, b: Recommendation) => b.fitScore - a.fitScore;
  const copy = [...recs];
  switch (key) {
    case "tuition":
      return copy.sort((a, b) => a.program.tuitionPerYearUSD.value - b.program.tuitionPerYearUSD.value || byFit(a, b));
    case "deadline":
      return copy.sort((a, b) => nextDeadlineDate(a, todayIso).localeCompare(nextDeadlineDate(b, todayIso)) || byFit(a, b));
    default:
      return copy.sort(byFit);
  }
}
