"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { MetroMap } from "@/components/roadmap/MetroMap";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import { buildPortfolioTasks, buildRoadmap } from "@/lib/engine/roadmap";
import { buildMetroMap } from "@/lib/engine/metro";
import { useMatchWeights } from "@/lib/store/match-weights";
import { STORAGE_KEYS, useLocalStorageValue } from "@/lib/store/local-storage";
import type { StudentProfile } from "@/lib/data/types";

const NO_COMPLETED_TASKS: string[] = [];

function RoadmapBody({ profile }: { profile: StudentProfile }) {
  const { result: matchResult } = useMatchWeights();
  const { recommendations } = useMemo(
    () => getRecommendations(profile, universities, programs, matchResult.weights),
    [profile, matchResult.weights]
  );
  const tasks = useMemo(
    () => [...buildRoadmap(profile, recommendations), ...buildPortfolioTasks(profile)],
    [profile, recommendations]
  );
  const map = useMemo(() => buildMetroMap(tasks), [tasks]);
  const [completedIds, setCompletedIds] = useLocalStorageValue<string[]>(
    STORAGE_KEYS.roadmapProgress,
    NO_COMPLETED_TASKS,
    NO_COMPLETED_TASKS
  );

  function toggleTask(id: string) {
    const next = completedIds.includes(id) ? completedIds.filter((t) => t !== id) : [...completedIds, id];
    setCompletedIds(next);
  }

  const nextAction = tasks.find((t) => t.priority !== "later" && !completedIds.includes(t.id)) ?? tasks.find((t) => !completedIds.includes(t.id));

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

      {nextAction && (
        <Card padding="lg" className="mt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Your next move</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{nextAction.title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{nextAction.reason}</p>
        </Card>
      )}

      <div className="mt-8">
        <MetroMap map={map} completedIds={completedIds} onToggle={toggleTask} />
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return <RequireProfile>{(profile) => <RoadmapBody profile={profile} />}</RequireProfile>;
}
