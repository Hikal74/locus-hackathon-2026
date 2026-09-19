"use client";

import { useMemo } from "react";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import { buildPortfolioTasks, buildRoadmap } from "@/lib/engine/roadmap";
import { buildMetroMap, findNextMicrotask } from "@/lib/engine/metro";
import { useMatchWeights } from "@/lib/store/match-weights";
import { STORAGE_KEYS, useLocalStorageValue } from "@/lib/store/local-storage";
import type { StudentProfile } from "@/lib/data/types";

const NO_COMPLETED_TASKS: string[] = [];

/** Shared by the Roadmap page and the home-page Roadmap tile so both always show the same plan and progress. */
export function useRoadmapPlan(profile: StudentProfile) {
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

  function toggleMicrotask(id: string) {
    const next = completedIds.includes(id) ? completedIds.filter((t) => t !== id) : [...completedIds, id];
    setCompletedIds(next);
  }

  const nextUp = findNextMicrotask(map, completedIds);

  return { recommendations, map, completedIds, toggleMicrotask, nextUp };
}
