import { DotMeter } from "@/components/ui/DotMeter";
import { WarningIcon } from "@/components/ui/icons";
import type { EssayCoachResult, EssayDimensionKey, EssayLevel } from "@/lib/ai/essaycoach-schema";

const DIMENSIONS: Record<EssayDimensionKey, string> = {
  clarity: "Clarity",
  specificity: "Specificity",
  voice: "Your voice",
  structure: "Structure",
  promptFit: "Fits the prompt",
};

const LEVEL: Record<Exclude<EssayLevel, "unclear">, { word: string; dots: number }> = {
  strong: { word: "Strong", dots: 3 },
  developing: { word: "Developing", dots: 2 },
  needs_work: { word: "Needs work", dots: 1 },
};

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{children}</p>;
}

export function EssayCoachResultView({ result }: { result: EssayCoachResult }) {
  const order = Object.keys(DIMENSIONS) as EssayDimensionKey[];
  const byKey = new Map(result.dimensions.map((d) => [d.key, d]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading>Overall</Heading>
        <p className="mt-2 text-lg font-semibold text-ink">{result.summary}</p>
      </div>

      <ul className="flex flex-col divide-y divide-line-soft">
        {order.map((key) => {
          const d = byKey.get(key);
          if (!d) return null;
          const level = d.level === "unclear" ? null : LEVEL[d.level];
          return (
            <li key={key} className="py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{DIMENSIONS[key]}</span>
                <span className="flex items-center gap-2">
                  {level && <span className="text-sm text-ink-soft">{level.word}</span>}
                  <DotMeter filled={level ? level.dots : null} />
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">{d.note}</p>
            </li>
          );
        })}
      </ul>

      {result.strengths.length > 0 && (
        <div>
          <Heading>What&apos;s working</Heading>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
            {result.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {result.suggestions.length > 0 && (
        <div>
          <Heading>What to work on</Heading>
          <ol className="mt-3 flex flex-col gap-4">
            {result.suggestions.map((s, i) => (
              <li key={`${i}-${s.issue}`} className="flex flex-col gap-1.5">
                <p className="text-sm font-semibold text-ink">
                  {i + 1}. {s.issue}
                </p>
                {s.quote && (
                  <blockquote className="border-l-2 border-ink pl-3 text-sm italic text-ink-soft">&ldquo;{s.quote}&rdquo;</blockquote>
                )}
                <p className="text-sm text-ink-soft">{s.advice}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.questionsToConsider.length > 0 && (
        <div>
          <Heading>Questions to help you add detail</Heading>
          <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
            {result.questionsToConsider.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-dashed border-ink-faint p-3 text-xs text-ink-soft">
        <WarningIcon width={14} height={14} className="mt-0.5 shrink-0" />
        <span>
          This is coaching, not rewriting — the words stay yours. It reads only the draft you pasted, can miss things, and
          isn&apos;t a prediction of how any admissions reader will respond.
        </span>
      </p>
    </div>
  );
}
