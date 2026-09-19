"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useProfile } from "@/lib/store/profile-context";
import { ONBOARDING_LEVELS, ONBOARDING_STEPS, type OnboardingLevel } from "@/lib/data/onboarding-steps";
import type { StudentProfile } from "@/lib/data/types";
import type { Draft, StepProps, UpdateDraft } from "@/components/profile/types";
import { AgeGradeStep } from "@/components/profile/steps/AgeGradeStep";
import { LanguagesStep } from "@/components/profile/steps/LanguagesStep";
import { FieldInterestsStep } from "@/components/profile/steps/FieldInterestsStep";
import { CountriesStep } from "@/components/profile/steps/CountriesStep";
import { CareerPathStep } from "@/components/profile/steps/CareerPathStep";
import { WantsStep } from "@/components/profile/steps/WantsStep";
import { AcademicsStep } from "@/components/profile/steps/AcademicsStep";
import { StandardizedExamsStep } from "@/components/profile/steps/StandardizedExamsStep";
import { LanguageExamsStep } from "@/components/profile/steps/LanguageExamsStep";
import { AdditionalContextStep } from "@/components/profile/steps/AdditionalContextStep";

const STEP_COMPONENTS: Record<string, React.ComponentType<StepProps>> = {
  "age-grade": AgeGradeStep,
  languages: LanguagesStep,
  "field-interests": FieldInterestsStep,
  countries: CountriesStep,
  "career-path": CareerPathStep,
  wants: WantsStep,
  academics: AcademicsStep,
  "standardized-exams": StandardizedExamsStep,
  "language-exams": LanguageExamsStep,
  "additional-context": AdditionalContextStep,
};

const INITIAL_DRAFT: Draft = {
  age: "",
  grade: "",
  nativeLanguage: "",
  languageOfInstruction: "",
  intendedField: "computer_science",
  interests: [],
  countryPreferences: [],
  careerPath: "",
  fieldWants: [],
  // No longer collected in the flow — a generous default so budget never
  // hard-filters or constrains anyone's matches. Still editable later via
  // the "What if" budget control on /recommendations.
  budgetPerYearUSD: "1000000",
  intendedIntake: "Fall 2027",
  gpaOn4Scale: "",
  curriculumType: "",
  standardizedExamsCompleted: [],
  languageExamsCompleted: [],
  englishLevel: "",
  prioritizeResearch: false,
  prioritizeScholarship: false,
  additionalContext: "",
};

const LEVELS: OnboardingLevel[] = [1, 2, 3, 4];

/** 0-100 fill for one level's bar: full once we're past it, proportional to the steps done inside it, empty before it. */
function levelFill(level: OnboardingLevel, stepIndex: number): number {
  const stepsInLevel = ONBOARDING_STEPS.map((s, i) => ({ s, i })).filter(({ s }) => s.level === level);
  const doneInLevel = stepsInLevel.filter(({ i }) => i <= stepIndex).length;
  return Math.round((doneInLevel / stepsInLevel.length) * 100);
}

export default function ProfilePage() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const { setProfile } = useProfile();
  const router = useRouter();

  const update: UpdateDraft = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const currentStep = ONBOARDING_STEPS[step];
  const StepComponent = STEP_COMPONENTS[currentStep.id];

  function canAdvance(): boolean {
    switch (currentStep.id) {
      case "countries":
        return draft.countryPreferences.length > 0;
      default:
        return true;
    }
  }

  function submit() {
    const languageLevel: StudentProfile["languageLevel"] = {};
    if (draft.englishLevel.trim()) {
      languageLevel.English = draft.englishLevel.trim();
    }

    const profile: StudentProfile = {
      age: draft.age.trim() ? Number(draft.age) : undefined,
      grade: draft.grade.trim() || undefined,
      nativeLanguage: draft.nativeLanguage.trim() || undefined,
      languageOfInstruction: draft.languageOfInstruction || undefined,
      intendedField: draft.intendedField,
      interests: draft.interests,
      countryPreferences: draft.countryPreferences,
      careerPath: draft.careerPath.trim() || undefined,
      fieldWants: draft.fieldWants,
      budgetPerYearUSD: Number(draft.budgetPerYearUSD),
      intendedIntake: draft.intendedIntake || "Fall 2027",
      // Clamped, not just hinted via the input's HTML `max` attribute (which
      // doesn't actually stop a value like 4.8 or 85 from being typed and
      // saved) — a GPA outside 0-4 broke every AI advisor request for the
      // student who ran into this, since the request schema rejected the
      // whole request rather than just this one field.
      gpaOn4Scale: draft.gpaOn4Scale.trim() ? Math.min(4, Math.max(0, Number(draft.gpaOn4Scale))) : undefined,
      curriculumType: draft.curriculumType || undefined,
      standardizedExamsCompleted: draft.standardizedExamsCompleted,
      languageExamsCompleted: draft.languageExamsCompleted,
      languageLevel,
      relevantSubjects: [],
      preferences: {
        prioritizeResearch: draft.prioritizeResearch,
        prioritizeScholarship: draft.prioritizeScholarship,
      },
      additionalContext: draft.additionalContext.trim() || undefined,
    };

    setProfile(profile);
    router.push("/diagnosis");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-semibold text-ink">
            Step {step + 1} of {ONBOARDING_STEPS.length}
          </span>
          <span className="text-right text-ink-faint">{ONBOARDING_LEVELS[currentStep.level].label}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Profile progress"
          aria-valuemin={0}
          aria-valuemax={ONBOARDING_STEPS.length}
          aria-valuenow={step + 1}
          className="mt-3 grid grid-cols-4 gap-1.5"
        >
          {LEVELS.map((lvl) => (
            <div key={lvl} className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
              <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${levelFill(lvl, step)}%` }} />
            </div>
          ))}
        </div>
        <ol className="mt-2 hidden grid-cols-4 gap-1.5 text-xs sm:grid">
          {LEVELS.map((lvl) => (
            <li key={lvl} className={currentStep.level === lvl ? "font-semibold text-ink" : "text-ink-faint"}>
              {ONBOARDING_LEVELS[lvl].label}
            </li>
          ))}
        </ol>
      </div>

      <Card padding="lg" className="flex flex-col gap-6">
        <StepComponent draft={draft} update={update} />

        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < ONBOARDING_STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
              Continue
            </Button>
          ) : (
            <Button onClick={submit}>See my diagnosis</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
