import { Badge } from "@/components/ui/Badge";
import { FIT_TIER_LABEL, type FitTier, type FitTierResult } from "@/lib/engine/tiers";

// Monochrome: distinguished by fill weight and border style, and always by the word itself.
const TONE: Record<FitTier, "danger" | "accent" | "primary" | "neutral"> = {
  reach: "danger",
  match: "accent",
  safety: "primary",
  unknown: "neutral",
};

export function TierBadge({ result }: { result: FitTierResult }) {
  return (
    <span title={result.reason}>
      <Badge tone={TONE[result.tier]}>{FIT_TIER_LABEL[result.tier]}</Badge>
    </span>
  );
}

/** Shown wherever a tier appears: the reason it was assigned, plus the limits of what it means. */
export function TierExplanation({ result }: { result: FitTierResult }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-ink-soft">
      <p>{result.reason}</p>
      <p className="text-xs text-ink-faint">
        Based only on your GPA vs. the program&apos;s published minimum and its selectivity — not a prediction of whether
        you&apos;ll be admitted.
      </p>
    </div>
  );
}
