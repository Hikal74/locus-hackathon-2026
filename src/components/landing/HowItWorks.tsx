import { Card } from "@/components/ui/Card";
import { BUDGET_HARD_CEILING_MULTIPLIER } from "@/lib/engine/weights";

const STEPS = [
  {
    title: "You tell us about you",
    body: "A short questionnaire in four effort levels: what you want to study, where you'd go, your GPA and exams, your goals.",
    note: "Only choosing at least one country is required. Skip anything you don't know yet — it shows up as a gap, not an error.",
  },
  {
    title: "We rule out what can't work",
    body: `Programs in the wrong field, outside your countries, or with tuition beyond ${BUDGET_HARD_CEILING_MULTIPLIER}× your budget are removed.`,
    note: "You can see how many were filtered out, and why.",
  },
  {
    title: "We score what's left",
    body: "Six factors, each scored 0–100, are combined by fixed, published weights into one fit score per program.",
    note: "The same profile always gives the same ranking.",
  },
  {
    title: "You get reasons and a plan",
    body: "Every match explains why it fits and what to watch out for, then feeds a comparison, a roadmap, and a deadline calendar.",
    note: "One clear next step, not a list of fifty tasks.",
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, i) => (
        <li key={step.title}>
          <Card padding="md" className="flex h-full flex-col gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ink text-sm font-semibold text-ink">
              {i + 1}
            </span>
            <h3 className="text-lg font-semibold leading-snug text-ink">{step.title}</h3>
            <p className="text-sm text-ink-soft">{step.body}</p>
            <p className="mt-auto border-t border-line-soft pt-3 text-xs text-ink-faint">{step.note}</p>
          </Card>
        </li>
      ))}
    </ol>
  );
}
