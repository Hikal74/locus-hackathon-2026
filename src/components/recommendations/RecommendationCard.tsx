"use client";

import { useState } from "react";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { ChevronDownIcon, HeartIcon, WarningIcon } from "@/components/ui/icons";
import { ValuesSought } from "@/components/university/ValuesSought";
import { CampusLifeDetails } from "@/components/university/CampusLifeDetails";
import { ReportCard } from "@/components/insights/ReportCard";
import { TierBadge, TierExplanation } from "@/components/insights/TierBadge";
import { useExplain } from "@/lib/ai/use-explain";
import { useProfile } from "@/lib/store/profile-context";
import { useSavedPrograms } from "@/lib/store/saved-programs";
import { getFitTier } from "@/lib/engine/tiers";
import { buildReportCard } from "@/lib/engine/reportcard";
import { isEstimatedLabel, toLocalIsoDate } from "@/lib/engine/deadlines";
import type { Recommendation } from "@/lib/engine/types";
import { cn } from "@/lib/utils/cn";

interface RecommendationCardProps {
  recommendation: Recommendation;
  selected: boolean;
  onToggleSelect: () => void;
}

type DetailTab = "why" | "report" | "values" | "campus";

function formatMonthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="flex flex-col items-start gap-1 text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

export function RecommendationCard({ recommendation, selected, onToggleSelect }: RecommendationCardProps) {
  const { university, program, fitScore, factors, whyItFits, watchOut } = recommendation;
  const { isSaved, toggleSave } = useSavedPrograms();
  const saved = isSaved(program.id);
  const { profile } = useProfile();
  const tier = profile ? getFitTier(profile, program) : null;
  const reportCard = profile ? buildReportCard(profile, program, university) : null;
  const [todayIso] = useState(() => toLocalIsoDate(new Date()));

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<DetailTab>("why");

  const { result, loading, fetchOnce } = useExplain({
    universityName: university.name,
    programName: program.name,
    country: university.country,
    whyItFits,
    watchOut,
  });

  const displayedWhyItFits = result?.whyItFits ?? whyItFits;
  const displayedWatchOut = result?.watchOut ?? watchOut;

  const tabs: { value: DetailTab; label: string }[] = [
    { value: "why", label: "Why it fits" },
    ...(tier && reportCard ? [{ value: "report" as const, label: "Report card" }] : []),
    ...(university.valuesSought ? [{ value: "values" as const, label: "What they look for" }] : []),
    ...(university.campusLife ? [{ value: "campus" as const, label: "Campus life" }] : []),
  ];

  const sortedDeadlines = [...program.deadlines].sort((a, b) => a.date.localeCompare(b.date));
  const nextDeadline = sortedDeadlines.find((d) => d.date >= todayIso) ?? sortedDeadlines[sortedDeadlines.length - 1];
  const nextDeadlinePassed = nextDeadline ? nextDeadline.date < todayIso : false;

  const languages = [...new Set(program.languageRequirements.map((l) => l.language))];

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && tab === "why") fetchOnce();
  }

  function selectTab(next: string) {
    setTab(next as DetailTab);
    if (next === "why") fetchOnce();
  }

  return (
    <Card padding="none" className="flex flex-col overflow-hidden">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-faint">
              {university.country} · {university.city}
            </p>
            <h3 className="mt-0.5 text-xl font-semibold leading-tight text-ink">{university.name}</h3>
            <p className="mt-1 text-sm text-ink-soft">{program.name}</p>
          </div>
          <div className="flex shrink-0 items-start gap-3">
            <div className="text-right">
              <p className="text-3xl font-semibold leading-none tabular-nums text-ink">{fitScore}%</p>
              <p className="mt-1 text-xs text-ink-faint">fit</p>
            </div>
            <button
              type="button"
              onClick={() => toggleSave(program.id)}
              aria-pressed={saved}
              aria-label={saved ? `Unsave ${program.name}` : `Save ${program.name}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
                saved ? "border-ink bg-ink text-on-primary" : "border-line text-ink-soft hover:border-ink hover:text-ink"
              )}
            >
              <HeartIcon width={16} height={16} filled={saved} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tier && <TierBadge result={tier} />}
          {program.researchOpportunities && <Badge tone="neutral">Research-active</Badge>}
          <Badge tone="neutral" className="capitalize">
            {program.selectivity.replace("_", " ")} selectivity
          </Badge>
          {languages.map((l) => (
            <Badge key={l} tone="neutral">
              {l}-taught
            </Badge>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-y divide-line-soft border-y border-line-soft sm:grid-cols-4 sm:divide-y-0">
        <Stat label="Tuition / year">
          <span>${program.tuitionPerYearUSD.value.toLocaleString("en-US")}</span>
          <VerificationBadge status={program.tuitionPerYearUSD.status} compact />
        </Stat>
        <Stat label="Min. GPA (4.0)">
          {program.minGpaOn4Scale ? (
            <>
              <span>{program.minGpaOn4Scale.value.toFixed(1)}</span>
              <VerificationBadge status={program.minGpaOn4Scale.status} compact />
            </>
          ) : (
            <span className="font-normal text-ink-faint">Not published</span>
          )}
        </Stat>
        <Stat label="Next deadline">
          {nextDeadline ? (
            <>
              <span>{formatMonthYear(nextDeadline.date)}</span>
              {nextDeadlinePassed ? (
                <span className="text-xs font-normal text-ink-faint">Date has passed</span>
              ) : isEstimatedLabel(nextDeadline.label) ? (
                <span className="text-xs font-normal text-ink-faint">Estimated</span>
              ) : null}
            </>
          ) : (
            <span className="font-normal text-ink-faint">—</span>
          )}
        </Stat>
        <Stat label="Living cost / month">
          {university.campusLife ? (
            <>
              <span>~${university.campusLife.costOfLivingPerMonthUSD.value.toLocaleString("en-US")}</span>
              <VerificationBadge status={university.campusLife.costOfLivingPerMonthUSD.status} compact />
            </>
          ) : (
            <span className="font-normal text-ink-faint">—</span>
          )}
        </Stat>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
        >
          {open ? "Hide details" : "Details"}
          <ChevronDownIcon width={15} height={15} className={cn("transition-transform", open && "rotate-180")} />
        </button>
        <Chip selected={selected} onClick={onToggleSelect} className="text-xs">
          {selected ? "Added to compare" : "Compare"}
        </Chip>
      </div>

      {open && (
        <div className="flex flex-col gap-4 border-t border-line-soft bg-surface-raised/40 p-5">
          <div className="max-w-full overflow-x-auto">
            <Tabs items={tabs} value={tab} onChange={selectTab} />
          </div>

          <div role="tabpanel">
            {tab === "why" && (
              <div className="flex flex-col gap-4">
                <div>
                  <ul className="flex flex-col gap-1.5 text-sm text-ink-soft">
                    {displayedWhyItFits.map((reason, i) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                  {result?.source === "ai" && (
                    <Badge tone="neutral" className="mt-2">
                      Phrasing enhanced by Gemini — facts unchanged
                    </Badge>
                  )}
                  {loading && <p className="mt-2 text-xs text-ink-faint">Polishing this explanation…</p>}
                </div>
                {displayedWatchOut.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <WarningIcon width={14} height={14} /> Watch out
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-1.5 text-sm text-ink-soft">
                      {displayedWatchOut.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex flex-col gap-2 border-t border-line-soft pt-3">
                  <p className="text-xs font-medium text-ink-faint">Score breakdown</p>
                  {factors.map((f) => (
                    <Progress key={f.key} label={f.label} value={f.score} tone="primary" />
                  ))}
                </div>
              </div>
            )}

            {tab === "report" && tier && reportCard && (
              <div className="flex flex-col gap-4">
                <TierExplanation result={tier} />
                <ReportCard entries={reportCard} />
              </div>
            )}

            {tab === "values" && university.valuesSought && <ValuesSought valuesSought={university.valuesSought} />}

            {tab === "campus" && university.campusLife && <CampusLifeDetails campusLife={university.campusLife} />}
          </div>

          <a
            href={university.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-sm text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Visit the university&apos;s website
          </a>
        </div>
      )}
    </Card>
  );
}
