import { Chip } from "@/components/ui/Chip";
import { toggle } from "../step-utils";
import type { StepProps } from "../types";

const STANDARDIZED_EXAM_OPTIONS = ["SAT", "ACT", "GRE", "GMAT", "UNT"];

export function StandardizedExamsStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Standardized exams</h1>
      <p className="text-sm text-ink-soft">Which of these have you already completed?</p>
      <div className="flex flex-wrap gap-2">
        {STANDARDIZED_EXAM_OPTIONS.map((exam) => (
          <Chip
            key={exam}
            selected={draft.standardizedExamsCompleted.includes(exam)}
            onClick={() => update("standardizedExamsCompleted", toggle(draft.standardizedExamsCompleted, exam))}
          >
            {exam}
          </Chip>
        ))}
      </div>
    </>
  );
}
