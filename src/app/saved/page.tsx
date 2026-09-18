"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { WarningIcon } from "@/components/ui/icons";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { useSavedPrograms } from "@/lib/store/saved-programs";
import { useMatchWeights } from "@/lib/store/match-weights";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import type { StudentProfile } from "@/lib/data/types";

function SavedBody({ profile }: { profile: StudentProfile }) {
  const { savedIds, toggleSave } = useSavedPrograms();
  const { result: matchResult } = useMatchWeights();
  const { recommendations, excluded } = getRecommendations(profile, universities, programs, matchResult.weights);

  const savedMatches = recommendations.filter((rec) => savedIds.includes(rec.program.id));
  const savedButExcluded = excluded.filter((e) => savedIds.includes(e.program.id));

  if (savedIds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">You haven&apos;t saved any programs yet.</p>
        <Link href="/recommendations" className="mt-4 inline-block">
          <Chip>Browse recommendations</Chip>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Saved programs</h1>
      <p className="mt-2 text-ink-soft">
        Programs you&apos;ve bookmarked while browsing. Fit scores update automatically if your profile changes.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {savedMatches.map((rec) => (
          <RecommendationCard key={rec.program.id} recommendation={rec} selected={false} onToggleSelect={() => {}} />
        ))}
      </div>

      {savedButExcluded.length > 0 && (
        <div className="mt-8">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <WarningIcon width={14} height={14} /> No longer matching your current profile
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {savedButExcluded.map(({ program, university, reason }) => (
              <Card key={program.id} padding="sm" className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {university.name} — {program.name}
                  </p>
                  <p className="text-xs text-ink-faint">{reason}</p>
                </div>
                <Chip onClick={() => toggleSave(program.id)} className="text-xs shrink-0">
                  Unsave
                </Chip>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavedPage() {
  return <RequireProfile>{(profile) => <SavedBody profile={profile} />}</RequireProfile>;
}
