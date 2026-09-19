/**
 * Single source of truth for the /profile questionnaire's step order and
 * effort-level tagging. Each step's actual field inputs live in its matching
 * component under src/components/profile/steps/ (looked up by `id`); this
 * file only owns the sequence and which of the 4 effort levels each step
 * belongs to. See docs/RECOMMENDATION_ENGINE.md's "personalized matching"
 * section for how the resulting StudentProfile feeds the engine.
 */

export type OnboardingLevel = 1 | 2 | 3 | 4;

export const ONBOARDING_LEVELS: Record<OnboardingLevel, { label: string; effort: string }> = {
  1: { label: "Quick Demographics", effort: "Zero effort" },
  2: { label: "Preferences & Aspirations", effort: "Low effort" },
  3: { label: "Career Goals & Field Requirements", effort: "Medium effort" },
  4: { label: "Metrics, Exams & Logistics", effort: "High effort" },
};

export interface OnboardingStep {
  id: string;
  level: OnboardingLevel;
  title: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "age-grade", level: 1, title: "Tell us a bit about you" },
  { id: "languages", level: 1, title: "What languages do you speak?" },
  { id: "field-interests", level: 2, title: "What do you want to study?" },
  { id: "career-path", level: 3, title: "What's your target career?" },
  { id: "countries", level: 2, title: "Where are you considering?" },
  { id: "wants", level: 3, title: "What are your priorities in university?" },
  { id: "academics", level: 4, title: "Your academic record" },
  { id: "standardized-exams", level: 4, title: "Standardized exams" },
  { id: "language-exams", level: 4, title: "Language proficiency" },
  { id: "additional-context", level: 4, title: "Anything else worth knowing?" },
];
