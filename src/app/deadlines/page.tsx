"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { WarningIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import {
  buildDeadlineTimeline,
  buildIcs,
  daysUntil,
  splitByToday,
  toLocalIsoDate,
  type DeadlineEntry,
} from "@/lib/engine/deadlines";
import { useMatchWeights } from "@/lib/store/match-weights";
import type { StudentProfile } from "@/lib/data/types";

const TOP_N = 5;

function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function relative(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

function downloadIcs(entries: DeadlineEntry[]) {
  const blob = new Blob([buildIcs(entries, new Date())], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pathlight-deadlines.ics";
  a.click();
  URL.revokeObjectURL(url);
}

function DeadlineRow({ entry, todayIso }: { entry: DeadlineEntry; todayIso: string }) {
  const days = daysUntil(entry.date, todayIso);
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-6">
      <div className="w-40 shrink-0">
        <p className="text-sm font-semibold text-ink">{formatDate(entry.date)}</p>
        <p className="text-xs text-ink-faint">{relative(days)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {entry.universityName} — {entry.label}
        </p>
        <p className="text-xs text-ink-soft">
          {entry.programName} · {entry.country}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {entry.estimated ? (
            <Badge tone="warning">
              <WarningIcon width={12} height={12} />
              Estimated date
            </Badge>
          ) : (
            <Badge tone="neutral">Confirm on the university site</Badge>
          )}
          <a
            href={entry.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ink-faint underline underline-offset-2 hover:text-ink"
          >
            Official website
          </a>
        </div>
      </div>
    </li>
  );
}

function DeadlinesBody({ profile }: { profile: StudentProfile }) {
  const { result: matchResult } = useMatchWeights();
  const [scope, setScope] = useState<"top" | "all">("top");
  const [today] = useState(() => new Date());
  const todayIso = toLocalIsoDate(today);

  const { recommendations } = useMemo(
    () => getRecommendations(profile, universities, programs, matchResult.weights),
    [profile, matchResult.weights]
  );
  const shown = scope === "top" ? recommendations.slice(0, TOP_N) : recommendations;
  const timeline = useMemo(() => buildDeadlineTimeline(shown), [shown]);
  const { upcoming, passed } = useMemo(() => splitByToday(timeline, todayIso), [timeline, todayIso]);

  const byMonth = useMemo(() => {
    const groups = new Map<string, DeadlineEntry[]>();
    for (const e of upcoming) {
      const key = e.date.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    return [...groups.entries()];
  }, [upcoming]);

  if (recommendations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-soft">
        No matched programs to list deadlines for yet — adjust your profile first.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Deadline calendar"
        description="Every known application and test deadline for your matches, soonest first. Add them to your own calendar with one download."
      />

      <Card padding="md" className="mt-6">
        <p className="flex items-start gap-2 text-sm text-ink-soft">
          <WarningIcon width={16} height={16} className="mt-0.5 shrink-0" />
          <span>
            Dates come from Pathlight&apos;s dataset and can change. Anything marked &ldquo;Estimated&rdquo; is a typical
            window, not an announced date — always confirm with the university before relying on it.
          </span>
        </p>
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Which matches to include">
          <Chip selected={scope === "top"} onClick={() => setScope("top")}>
            Top {Math.min(TOP_N, recommendations.length)} matches
          </Chip>
          <Chip selected={scope === "all"} onClick={() => setScope("all")}>
            All {recommendations.length} matches
          </Chip>
        </div>
        <Button size="sm" onClick={() => downloadIcs(upcoming)} disabled={upcoming.length === 0}>
          Download calendar (.ics)
        </Button>
      </div>

      {upcoming.length === 0 ? (
        <p className="mt-8 text-ink-soft">No upcoming deadlines in the data for these programs.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {byMonth.map(([month, entries]) => (
            <section key={month}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint">{monthLabel(`${month}-01`)}</h2>
              <ul className="mt-2 divide-y divide-line-soft border-y border-line-soft">
                {entries.map((entry) => (
                  <DeadlineRow key={entry.id} entry={entry} todayIso={todayIso} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {passed.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-semibold text-ink underline underline-offset-2">
            Already passed ({passed.length})
          </summary>
          <p className="mt-2 text-xs text-ink-faint">
            These dates are behind us — they may just need a newer cycle&apos;s date, so check the university&apos;s site.
          </p>
          <ul className="mt-2 divide-y divide-line-soft border-y border-line-soft opacity-70">
            {passed.map((entry) => (
              <DeadlineRow key={entry.id} entry={entry} todayIso={todayIso} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function DeadlinesPage() {
  return <RequireProfile>{(profile) => <DeadlinesBody profile={profile} />}</RequireProfile>;
}
