import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { toggle } from "../step-utils";
import type { StepProps } from "../types";

const LANGUAGE_EXAM_OPTIONS = ["IELTS", "TOEFL"];

export function LanguageExamsStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Language proficiency</h1>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">Language exams already taken</span>
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
          {LANGUAGE_EXAM_OPTIONS.map((exam) => (
            <Chip
              key={exam}
              selected={draft.languageExamsCompleted.includes(exam)}
              onClick={() => update("languageExamsCompleted", toggle(draft.languageExamsCompleted, exam))}
              className="shrink-0"
            >
              {exam}
            </Chip>
          ))}
        </div>
      </div>
      <Input
        label="Your score / result (optional)"
        placeholder="e.g. IELTS 6.5"
        value={draft.englishLevel}
        onChange={(e) => update("englishLevel", e.target.value)}
      />
    </>
  );
}
