import { Chip } from "@/components/ui/Chip";
import { programs } from "@/lib/data/dataset";
import type { FieldOfStudy } from "@/lib/data/types";
import { toggle } from "../step-utils";
import type { StepProps } from "../types";

const FIELD_OPTIONS: { value: FieldOfStudy; label: string }[] = [
  { value: "computer_science", label: "Computer Science" },
  { value: "business", label: "Business" },
  { value: "engineering", label: "Engineering" },
  { value: "medicine", label: "Medicine" },
  { value: "natural_sciences", label: "Natural Sciences" },
  { value: "humanities", label: "Humanities" },
  { value: "arts", label: "Arts" },
];

/** Derived from the actual dataset rather than hardcoded, so it can't drift out of sync as programs are added. */
const FIELDS_WITH_PROGRAMS = new Set(programs.map((p) => p.field));

/**
 * Curated fallback for fields this build's dataset has no programs in (Arts,
 * Medicine — see docs/DATA_AND_TRUST.md's known gap) so "Specific interests"
 * isn't left empty just because there's nothing to derive tags from yet.
 */
const FALLBACK_INTERESTS: Partial<Record<FieldOfStudy, string[]>> = {
  arts: [
    "Visual arts",
    "Graphic design",
    "Illustration",
    "Photography",
    "Film & video",
    "Animation",
    "Fashion design",
    "Music",
    "Performing arts",
    "Fine arts",
    "Digital media",
    "Art history",
  ],
  medicine: ["Clinical medicine", "Surgery", "Public health", "Biomedical research", "Pharmacology", "Mental health"],
};

function getInterestOptions(field: FieldOfStudy): string[] {
  const fromDataset = Array.from(new Set(programs.filter((p) => p.field === field).flatMap((p) => p.tags))).sort();
  return fromDataset.length > 0 ? fromDataset : (FALLBACK_INTERESTS[field] ?? []);
}

export function FieldInterestsStep({ draft, update }: StepProps) {
  // Scoped to the chosen field so a Computer Science student sees "AI", "robotics", etc.
  // instead of every tag in the whole dataset (Business/Engineering/Humanities included).
  const interestOptions = getInterestOptions(draft.intendedField);

  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">What do you want to study?</h1>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">Field</span>
        <div className="flex flex-wrap gap-2">
          {FIELD_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={draft.intendedField === opt.value}
              onClick={() => {
                update("intendedField", opt.value);
                // Drop any previously picked interest that doesn't apply under the newly chosen field.
                const nextOptions = new Set(getInterestOptions(opt.value));
                update("interests", draft.interests.filter((i) => nextOptions.has(i)));
              }}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
        {!FIELDS_WITH_PROGRAMS.has(draft.intendedField) && (
          <p className="text-xs text-ink-faint">
            This build&apos;s dataset doesn&apos;t have programs in this field yet — you won&apos;t see matches until it does.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">Specific interests (optional, pick any that fit)</span>
        <div className="flex flex-wrap gap-2">
          {interestOptions.map((interest) => (
            <Chip
              key={interest}
              selected={draft.interests.includes(interest)}
              onClick={() => update("interests", toggle(draft.interests, interest))}
            >
              {interest}
            </Chip>
          ))}
        </div>
      </div>
    </>
  );
}
