"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { HeartIcon, WarningIcon } from "@/components/ui/icons";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { PageHeader } from "@/components/layout/PageHeader";
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
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <PageHeader title="Saved programs" description="Programs you bookmark while browsing show up here." />
        <Card padding="lg" className="mt-8 flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink-soft">
            <HeartIcon width={22} height={22} />
          </span>
          <div>
            <p className="text-lg font-semibold text-ink">Nothing saved yet</p>
            <p className="mt-1 text-sm text-ink-soft">Tap the heart on any university match to keep it here for later.</p>
          </div>
          <Link href="/universities">
            <Button>Browse university matches</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Saved programs"
        description="Programs you've bookmarked while browsing. Fit scores update automatically if your profile changes."
        actions={
          savedMatches.length >= 2 ? (
            <Link href={`/compare?ids=${savedMatches.slice(0, 3).map((r) => r.program.id).join(",")}`}>
              <Button variant="secondary">Compare top {Math.min(3, savedMatches.length)}</Button>
            </Link>
          ) : undefined
        }
      />

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
