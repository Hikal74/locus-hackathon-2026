"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Textarea";
import { useProfile } from "@/lib/store/profile-context";
import { programs } from "@/lib/data/dataset";
import type { Country, FieldOfStudy, LanguageRequirement, StudentProfile } from "@/lib/data/types";

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
const INTEREST_OPTIONS = Array.from(new Set(programs.flatMap((p) => p.tags))).sort();

const COUNTRY_OPTIONS: Country[] = ["USA", "Kazakhstan", "China"];

const EXAM_OPTIONS = ["IELTS", "TOEFL", "SAT", "ACT", "UNT", "HSK"];

type Draft = {
  intendedField: FieldOfStudy;
  interests: string[];
  countryPreferences: Country[];
  budgetPerYearUSD: string;
  prioritizeResearch: boolean;
  prioritizeScholarship: boolean;
  gpaOn4Scale: string;
  englishLevel: string;
  examsCompleted: string[];
  intendedIntake: string;
  additionalContext: string;
};

const INITIAL_DRAFT: Draft = {
  intendedField: "computer_science",
  interests: [],
  countryPreferences: [],
  budgetPerYearUSD: "",
  prioritizeResearch: false,
  prioritizeScholarship: false,
  gpaOn4Scale: "",
  englishLevel: "",
  examsCompleted: [],
  intendedIntake: "Fall 2027",
  additionalContext: "",
};

const STEP_COUNT = 6;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function ProfilePage() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const { setProfile } = useProfile();
  const router = useRouter();

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return Boolean(draft.intendedField);
      case 1:
        return draft.countryPreferences.length > 0;
      case 2:
        return draft.budgetPerYearUSD.trim() !== "" && Number(draft.budgetPerYearUSD) > 0;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }

  function submit() {
    const languageLevel: StudentProfile["languageLevel"] = {};
    if (draft.englishLevel.trim()) {
      (languageLevel as Record<LanguageRequirement["language"], string>).English = draft.englishLevel.trim();
    }

    const profile: StudentProfile = {
      intendedField: draft.intendedField,
      interests: draft.interests,
      relevantSubjects: [],
      countryPreferences: draft.countryPreferences,
      budgetPerYearUSD: Number(draft.budgetPerYearUSD),
      languageLevel,
      examsCompleted: draft.examsCompleted,
      intendedIntake: draft.intendedIntake || "Fall 2027",
      // Clamped, not just hinted via the input's HTML `max` attribute (which
      // doesn't actually stop a value like 4.8 or 85 from being typed and
      // saved) — a GPA outside 0-4 broke every AI advisor request for the
      // student who ran into this, since the request schema rejected the
      // whole request rather than just this one field.
      gpaOn4Scale: draft.gpaOn4Scale.trim() ? Math.min(4, Math.max(0, Number(draft.gpaOn4Scale))) : undefined,
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
      <Progress label={`Step ${step + 1} of ${STEP_COUNT}`} value={((step + 1) / STEP_COUNT) * 100} className="mb-8" />

      <Card padding="lg" className="flex flex-col gap-6">
        {step === 0 && (
          <>
            <h1 className="text-2xl font-semibold text-ink">What do you want to study?</h1>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink-soft">Field</span>
              <div className="flex flex-wrap gap-2">
                {FIELD_OPTIONS.map((opt) => (
                  <Chip key={opt.value} selected={draft.intendedField === opt.value} onClick={() => update("intendedField", opt.value)}>
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
                {INTEREST_OPTIONS.map((interest) => (
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
        )}

        {step === 1 && (
          <>
            <h1 className="text-2xl font-semibold text-ink">Where are you considering?</h1>
            <p className="text-sm text-ink-soft">
              Tap countries in order of preference — the order affects how we rank otherwise-similar matches.
            </p>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_OPTIONS.map((country) => {
                const rank = draft.countryPreferences.indexOf(country);
                return (
                  <Chip
                    key={country}
                    selected={rank !== -1}
                    onClick={() => update("countryPreferences", toggle(draft.countryPreferences, country))}
                  >
                    {rank !== -1 ? `${rank + 1}. ` : ""}
                    {country}
                  </Chip>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-semibold text-ink">What matters most?</h1>
            <Input
              label="Budget per year (USD)"
              type="number"
              min={0}
              value={draft.budgetPerYearUSD}
              onChange={(e) => update("budgetPerYearUSD", e.target.value)}
              hint="Tuition only — we'll flag programs that need scholarships to close the gap rather than hiding them."
            />
            <div className="flex flex-col gap-2">
              <Chip selected={draft.prioritizeResearch} onClick={() => update("prioritizeResearch", !draft.prioritizeResearch)}>
                Research opportunities matter to me
              </Chip>
              <Chip selected={draft.prioritizeScholarship} onClick={() => update("prioritizeScholarship", !draft.prioritizeScholarship)}>
                Scholarship availability matters to me
              </Chip>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-semibold text-ink">Where are you academically?</h1>
            <Input
              label="GPA (4.0 scale, optional)"
              type="number"
              step="0.1"
              min={0}
              max={4}
              value={draft.gpaOn4Scale}
              onChange={(e) => update("gpaOn4Scale", e.target.value)}
              hint="Leave blank if you use a different grading scale — we won't penalize missing data."
            />
            <Input
              label="English level (optional)"
              placeholder="e.g. IELTS 6.5"
              value={draft.englishLevel}
              onChange={(e) => update("englishLevel", e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink-soft">Exams already completed</span>
              <div className="flex flex-wrap gap-2">
                {EXAM_OPTIONS.map((exam) => (
                  <Chip key={exam} selected={draft.examsCompleted.includes(exam)} onClick={() => update("examsCompleted", toggle(draft.examsCompleted, exam))}>
                    {exam}
                  </Chip>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-2xl font-semibold text-ink">Anything else worth knowing? (optional)</h1>
            <p className="text-sm text-ink-soft">
              Projects, competitions, research, leadership, awards, volunteering, career goals, or anything else
              about your situation. This isn&apos;t scored by the matching algorithm above — it goes straight to the
              AI advisor, which reads it and reasons about it directly, so write in your own words instead of trying
              to fit a form field.
            </p>
            <Textarea
              label="In your own words"
              placeholder="e.g. Built a machine-learning project that placed top 3 in a national science fair; captain of the robotics club; want to eventually work in AI research but worried my portfolio is thin outside of coursework…"
              rows={6}
              maxLength={4000}
              value={draft.additionalContext}
              onChange={(e) => update("additionalContext", e.target.value)}
              hint={`${draft.additionalContext.length}/4000`}
            />
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="text-2xl font-semibold text-ink">One more thing</h1>
            <Input
              label="Intended intake"
              placeholder="e.g. Fall 2027"
              value={draft.intendedIntake}
              onChange={(e) => update("intendedIntake", e.target.value)}
            />
            <p className="text-sm text-ink-soft">
              That&apos;s everything we need. We&apos;ll build your diagnosis and shortlist from this next.
            </p>
          </>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          {step < STEP_COUNT - 1 ? (
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
