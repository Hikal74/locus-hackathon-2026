import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import type { StepProps } from "../types";

const GRADE_OPTIONS = ["9th grade", "10th grade", "11th grade", "12th grade", "Gap year", "Other"];

/** Native <select> — scrollable dropdown of ages, matching the app's typical secondary-school/undergrad applicant. */
const AGE_OPTIONS = Array.from({ length: 13 }, (_, i) => String(13 + i)); // 13-25

export function AgeGradeStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Tell us a bit about you</h1>
      <Select
        label="Age (optional)"
        value={draft.age}
        onChange={(e) => update("age", e.target.value)}
        options={[{ value: "", label: "Select your age" }, ...AGE_OPTIONS.map((age) => ({ value: age, label: age }))]}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">Current grade / academic level (optional)</span>
        <div className="flex flex-wrap gap-2">
          {GRADE_OPTIONS.map((g) => (
            <Chip key={g} selected={draft.grade === g} onClick={() => update("grade", draft.grade === g ? "" : g)}>
              {g}
            </Chip>
          ))}
        </div>
      </div>
    </>
  );
}
