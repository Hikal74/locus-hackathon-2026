import { Badge } from "@/components/ui/Badge";
import { DotMeter } from "@/components/ui/DotMeter";
import { WarningIcon } from "@/components/ui/icons";
import type { VibeCheckResult, VibeLevel, VibeTraitKey } from "@/lib/ai/vibecheck-schema";

const TRAITS: Record<VibeTraitKey, { label: string; words: Record<Exclude<VibeLevel, "unclear">, string> }> = {
  workload: { label: "Reading & workload", words: { high: "Heavy", medium: "Moderate", low: "Light" } },
  exams: { label: "Exam weight", words: { high: "Exam-heavy", medium: "Mixed", low: "Exam-light" } },
  attendance: { label: "Attendance", words: { high: "Strict", medium: "Some", low: "Relaxed" } },
  feedback: { label: "Feedback", words: { high: "Detailed", medium: "Some", low: "Minimal" } },
  grading: { label: "Grading", words: { high: "Tough", medium: "Fair", low: "Lenient" } },
  approachability: { label: "Approachability", words: { high: "Very", medium: "Somewhat", low: "Distant" } },
};

const LEVEL_DOTS: Record<Exclude<VibeLevel, "unclear">, number> = { high: 3, medium: 2, low: 1 };

const CONFIDENCE_LABEL = { low: "Low confidence", medium: "Medium confidence", high: "High confidence" } as const;

/** Every trait shows the evidence behind it — a rating with no visible reason isn't trustworthy. */
export function VibeResult({ result }: { result: VibeCheckResult }) {
  const order = Object.keys(TRAITS) as VibeTraitKey[];
  const byKey = new Map(result.traits.map((t) => [t.key, t]));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={result.confidence === "high" ? "primary" : result.confidence === "medium" ? "accent" : "warning"}>
            {CONFIDENCE_LABEL[result.confidence]}
          </Badge>
        </div>
        <h2 className="mt-2 text-2xl font-semibold text-ink">{result.headline}</h2>
      </div>

      <ul className="flex flex-col divide-y divide-line-soft">
        {order.map((key) => {
          const trait = byKey.get(key);
          if (!trait) return null;
          const config = TRAITS[key];
          const word = trait.level === "unclear" ? null : config.words[trait.level];
          return (
            <li key={key} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{config.label}</span>
                <span className="flex items-center gap-2">
                  {word && <span className="text-sm text-ink-soft">{word}</span>}
                  <DotMeter filled={trait.level === "unclear" ? null : LEVEL_DOTS[trait.level]} />
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">{trait.evidence}</p>
            </li>
          );
        })}
      </ul>

      {result.goodFor && result.goodFor.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Good for</p>
          <ul className="mt-1.5 list-disc pl-5 text-sm text-ink-soft">
            {result.goodFor.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      {result.watchOutFor && result.watchOutFor.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Watch out for</p>
          <ul className="mt-1.5 list-disc pl-5 text-sm text-ink-soft">
            {result.watchOutFor.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-dashed border-ink-faint p-3 text-xs text-ink-soft">
        <WarningIcon width={14} height={14} className="mt-0.5 shrink-0" />
        <span>
          {result.coverageNote} Based only on the text you pasted — not a verified rating of any instructor.
        </span>
      </p>
    </div>
  );
}
