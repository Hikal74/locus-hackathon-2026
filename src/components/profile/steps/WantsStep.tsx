import { Chip } from "@/components/ui/Chip";
import { toggle } from "../step-utils";
import type { StepProps } from "../types";

/**
 * Curated must-have program features. Deliberately AI-advisor context only —
 * not a new deterministic scoring factor, see docs/RECOMMENDATION_ENGINE.md's
 * 6-factor model. `prioritizeResearch`/`prioritizeScholarship` below are the
 * existing, separate deterministic preferences (feed preferencesFit()).
 */
const WANTS_OPTIONS = [
  "Research labs / facilities",
  "Internship placement",
  "Industry accreditation (e.g. ABET)",
  "Small class sizes",
  "Study abroad options",
  "Strong alumni network",
];

export function WantsStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">What are your priorities in university?</h1>
      <p className="text-sm text-ink-soft">Pick any must-haves for the field you&apos;re targeting.</p>
      <div className="flex flex-wrap gap-2">
        {WANTS_OPTIONS.map((want) => (
          <Chip key={want} selected={draft.fieldWants.includes(want)} onClick={() => update("fieldWants", toggle(draft.fieldWants, want))}>
            {want}
          </Chip>
        ))}
      </div>
      <Chip selected={draft.prioritizeResearch} onClick={() => update("prioritizeResearch", !draft.prioritizeResearch)}>
        Prioritize research opportunities when ranking matches
      </Chip>
      <Chip selected={draft.prioritizeScholarship} onClick={() => update("prioritizeScholarship", !draft.prioritizeScholarship)}>
        Scholarship availability matters to me
      </Chip>
    </>
  );
}
