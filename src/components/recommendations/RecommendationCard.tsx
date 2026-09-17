"use client";

import { ClayBadge, VerificationBadge } from "@/components/clay/ClayBadge";
import { ClayCard } from "@/components/clay/ClayCard";
import { ClayChip } from "@/components/clay/ClayChip";
import { ClayProgress } from "@/components/clay/ClayProgress";
import { useExplain } from "@/lib/ai/use-explain";
import { useSavedPrograms } from "@/lib/store/saved-programs";
import type { Recommendation } from "@/lib/engine/types";

interface RecommendationCardProps {
  recommendation: Recommendation;
  selected: boolean;
  onToggleSelect: () => void;
}

export function RecommendationCard({ recommendation, selected, onToggleSelect }: RecommendationCardProps) {
  const { university, program, fitScore, factors, whyItFits, watchOut } = recommendation;
  const { isSaved, toggleSave } = useSavedPrograms();
  const saved = isSaved(program.id);

  const { result, loading, fetchOnce } = useExplain({
    universityName: university.name,
    programName: program.name,
    country: university.country,
    whyItFits,
    watchOut,
  });

  const displayedWhyItFits = result?.whyItFits ?? whyItFits;
  const displayedWatchOut = result?.watchOut ?? watchOut;

  return (
    <ClayCard padding="md" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-ink-faint">{university.country} · {university.city}</p>
          <h3 className="text-lg font-semibold text-ink">{university.name}</h3>
          <p className="text-sm text-ink-soft">{program.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <ClayBadge tone="primary">{fitScore}% match</ClayBadge>
          <div className="flex gap-2">
            <ClayChip
              selected={saved}
              onClick={() => toggleSave(program.id)}
              className="text-xs"
              aria-label={saved ? `Unsave ${program.name}` : `Save ${program.name}`}
            >
              {saved ? "Saved" : "Save"}
            </ClayChip>
            <ClayChip selected={selected} onClick={onToggleSelect} className="text-xs">
              {selected ? "Selected" : "Compare"}
            </ClayChip>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <span>${program.tuitionPerYearUSD.value.toLocaleString()}/yr</span>
        <VerificationBadge status={program.tuitionPerYearUSD.status} />
        {program.researchOpportunities && <ClayBadge tone="neutral">Research-active</ClayBadge>}
      </div>

      <details className="group" onToggle={(e) => e.currentTarget.open && fetchOnce()}>
        <summary className="cursor-pointer list-none text-sm font-medium text-primary marker:content-none">
          Why it fits
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ul className="flex flex-1 flex-col gap-1.5 text-sm text-ink-soft">
                {displayedWhyItFits.map((reason, i) => (
                  <li key={i}>• {reason}</li>
                ))}
              </ul>
            </div>
            {result?.source === "ai" && (
              <ClayBadge tone="neutral" className="mt-2">
                Phrasing enhanced by Gemini — facts unchanged
              </ClayBadge>
            )}
            {loading && <p className="mt-2 text-xs text-ink-faint">Polishing this explanation…</p>}
          </div>
          {displayedWatchOut.length > 0 && (
            <div>
              <p className="text-sm font-medium text-warning">Watch out</p>
              <ul className="mt-1.5 flex flex-col gap-1.5 text-sm text-ink-soft">
                {displayedWatchOut.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
            <p className="text-xs font-medium text-ink-faint">Score breakdown</p>
            {factors.map((f) => (
              <ClayProgress key={f.key} label={f.label} value={f.score} tone="primary" />
            ))}
          </div>
        </div>
      </details>
    </ClayCard>
  );
}
