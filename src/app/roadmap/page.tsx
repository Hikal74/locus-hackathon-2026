"use client";

import { Card } from "@/components/ui/Card";
import { MetroMap } from "@/components/roadmap/MetroMap";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { useRoadmapPlan } from "@/lib/store/use-roadmap-plan";
import type { StudentProfile } from "@/lib/data/types";

function RoadmapBody({ profile }: { profile: StudentProfile }) {
  const { recommendations, map, completedIds, toggleMicrotask, nextUp } = useRoadmapPlan(profile);

  if (recommendations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-soft">
        No matched programs to build a roadmap from yet — adjust your profile or widen your recommendations filters.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Your path to a dream portfolio</h1>
      <p className="mt-2 text-ink-soft">
        Four tracks, built from your top {Math.min(3, recommendations.length)} matched programs plus a portfolio
        activity library — every station is something specific you can do. Click one to see why it&apos;s here.
      </p>

      {nextUp && (
        <Card padding="lg" className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Do this right now</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{nextUp.microtask.title}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Part of &ldquo;{nextUp.station.title}&rdquo; — {nextUp.station.reason}
          </p>
        </Card>
      )}

      <div className="mt-8">
        <MetroMap map={map} completedIds={completedIds} onToggleMicrotask={toggleMicrotask} />
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return <RequireProfile>{(profile) => <RoadmapBody profile={profile} />}</RequireProfile>;
}
