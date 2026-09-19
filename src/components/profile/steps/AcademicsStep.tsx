import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import type { CurriculumType } from "@/lib/data/types";
import type { StepProps } from "../types";

const CURRICULUM_OPTIONS: CurriculumType[] = ["IB", "AP", "A-Levels", "National", "Other"];

/**
 * Native <select> — scrollable dropdown, 0.0 to 5.0 in 0.1 steps. Goes past
 * 4.0 on purpose: not every school uses a 4.0 scale (Kazakhstan commonly
 * grades on a 5-point scale, e.g. "4.8" or "3.5-3.7"), so a student should be
 * able to pick their real number here. Values above 4.0 are clamped to 4.0
 * at submit time (see profile/page.tsx) — a safe floor, not a true scale
 * conversion, same known limitation documented in RECOMMENDATION_ENGINE.md.
 */
const GPA_OPTIONS = Array.from({ length: 51 }, (_, i) => (i * 0.1).toFixed(1));

export function AcademicsStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Your academic record</h1>
      <Select
        label="GPA (optional)"
        value={draft.gpaOn4Scale}
        onChange={(e) => update("gpaOn4Scale", e.target.value)}
        options={[{ value: "", label: "Select your GPA" }, ...GPA_OPTIONS.map((g) => ({ value: g, label: g }))]}
        hint="Whatever scale your school uses (4.0, 5.0, etc.) — pick your actual number."
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">Curriculum (optional)</span>
        <div className="flex flex-wrap gap-2">
          {CURRICULUM_OPTIONS.map((c) => (
            <Chip
              key={c}
              selected={draft.curriculumType === c}
              onClick={() => update("curriculumType", draft.curriculumType === c ? "" : c)}
            >
              {c}
            </Chip>
          ))}
        </div>
      </div>
    </>
  );
}
