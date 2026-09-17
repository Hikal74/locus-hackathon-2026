"use client";

import { useMemo } from "react";
import { ClayBadge } from "@/components/clay/ClayBadge";
import { ClayCard } from "@/components/clay/ClayCard";
import { ClayProgress } from "@/components/clay/ClayProgress";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import { buildRoadmap, computeReadiness, type RoadmapPriority } from "@/lib/engine/roadmap";
import { STORAGE_KEYS, useLocalStorageValue } from "@/lib/store/local-storage";
import type { StudentProfile } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";

const PRIORITY_LABELS: Record<RoadmapPriority, string> = { now: "Now", next: "Next", later: "Later" };
const NO_COMPLETED_TASKS: string[] = [];

function RoadmapBody({ profile }: { profile: StudentProfile }) {
  const { recommendations } = useMemo(() => getRecommendations(profile, universities, programs), [profile]);
  const tasks = useMemo(() => buildRoadmap(profile, recommendations), [profile, recommendations]);
  const [completedIds, setCompletedIds] = useLocalStorageValue<string[]>(
    STORAGE_KEYS.roadmapProgress,
    NO_COMPLETED_TASKS,
    NO_COMPLETED_TASKS
  );

  function toggleTask(id: string) {
    const next = completedIds.includes(id) ? completedIds.filter((t) => t !== id) : [...completedIds, id];
    setCompletedIds(next);
  }

  const readiness = computeReadiness(tasks, completedIds);
  const nextAction = tasks.find((t) => !completedIds.includes(t.id));

  if (recommendations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-soft">
        No matched programs to build a roadmap from yet — adjust your profile or widen your recommendations filters.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Your roadmap</h1>
      <p className="mt-2 text-ink-soft">Built from your top {Math.min(3, recommendations.length)} matched programs.</p>

      {nextAction && (
        <ClayCard padding="lg" className="mt-8 border-2 border-primary/20">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Your next move</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{nextAction.title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{nextAction.reason}</p>
        </ClayCard>
      )}

      <ClayCard padding="md" className="mt-6">
        <h2 className="font-semibold text-ink">Readiness</h2>
        <p className="mt-1 text-xs text-ink-faint">Based on completed tasks below — not an admission probability.</p>
        <div className="mt-4 flex flex-col gap-4">
          {readiness.map((r) => (
            <ClayProgress key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      </ClayCard>

      <div className="mt-8 flex flex-col gap-6">
        {(["now", "next", "later"] as RoadmapPriority[]).map((priority) => {
          const group = tasks.filter((t) => t.priority === priority);
          if (group.length === 0) return null;
          return (
            <div key={priority}>
              <ClayBadge tone={priority === "now" ? "accent" : "neutral"}>{PRIORITY_LABELS[priority]}</ClayBadge>
              <div className="mt-3 flex flex-col gap-2">
                {group.map((task) => {
                  const done = completedIds.includes(task.id);
                  return (
                    <ClayCard key={task.id} padding="sm" className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={() => toggleTask(task.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                        aria-label={`Mark "${task.title}" as done`}
                      />
                      <div>
                        <p className={cn("text-sm font-medium text-ink", done && "line-through text-ink-faint")}>
                          {task.title}
                        </p>
                        <p className="text-xs text-ink-faint">{task.reason}</p>
                      </div>
                    </ClayCard>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return <RequireProfile>{(profile) => <RoadmapBody profile={profile} />}</RequireProfile>;
}
