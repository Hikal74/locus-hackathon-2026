"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { ToolTile } from "@/components/landing/ToolTile";
import { ExampleButton } from "@/components/landing/ExampleButton";
import { useProfile } from "@/lib/store/profile-context";
import { useRoadmapPlan } from "@/lib/store/use-roadmap-plan";
import type { StudentProfile } from "@/lib/data/types";

/** Four parallel lines (distinguished by stroke pattern, not color) converging on one terminus. */
function RoadmapTeaser() {
  const dashes = ["", "10 6", "2 7", "12 4 2 4"];
  return (
    <svg viewBox="0 0 220 110" className="w-full" role="img" aria-label="Four tracks converging on a dream portfolio">
      {dashes.map((dash, i) => {
        const y = 14 + i * 24;
        return (
          <g key={i}>
            <path
              d={`M 8 ${y} L 130 ${y} L 190 55`}
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dash || undefined}
              className="text-ink"
            />
            {[24, 64, 104].map((x) => (
              <circle key={x} cx={x} cy={y} r={4} className="fill-paper stroke-ink" strokeWidth={2} />
            ))}
          </g>
        );
      })}
      <circle cx={194} cy={55} r={9} className="fill-paper stroke-ink" strokeWidth={3} />
    </svg>
  );
}

function RoadmapTileWithProfile({ profile }: { profile: StudentProfile }) {
  const { map, completedIds, nextUp } = useRoadmapPlan(profile);
  const stepIds = map.lines.flatMap((l) => l.stations.flatMap((s) => s.microtasks.map((m) => m.id)));
  const done = stepIds.filter((id) => completedIds.includes(id)).length;
  const percent = stepIds.length === 0 ? 0 : Math.round((done / stepIds.length) * 100);

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div>
        {nextUp ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Do this right now</p>
            <p className="mt-1 text-lg font-semibold text-ink">{nextUp.microtask.title}</p>
            <p className="mt-1 text-sm text-ink-soft">Part of &ldquo;{nextUp.station.title}&rdquo;</p>
          </>
        ) : (
          <p className="text-lg font-semibold text-ink">Every step on your roadmap is done.</p>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <Progress label={`${done} of ${stepIds.length} steps done`} value={percent} />
        <Link href="/roadmap">
          <Button size="sm">Open my roadmap</Button>
        </Link>
      </div>
    </div>
  );
}

export function RoadmapTile() {
  const { profile } = useProfile();

  return (
    <ToolTile
      title="Your roadmap"
      description="Four tracks, one dream portfolio — with the next step spelled out."
      href="/roadmap"
    >
      {profile === undefined ? null : profile === null ? (
        <div className="flex h-full flex-col justify-between gap-4">
          <RoadmapTeaser />
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/profile">
              <Button size="sm">Take the test</Button>
            </Link>
            <ExampleButton compact />
          </div>
        </div>
      ) : (
        <RoadmapTileWithProfile profile={profile} />
      )}
    </ToolTile>
  );
}
