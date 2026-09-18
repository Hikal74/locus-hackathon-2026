"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { useAdvisorUi } from "@/components/advisor/advisor-context";
import { useProfile } from "@/lib/store/profile-context";
import { useSavedPrograms } from "@/lib/store/saved-programs";
import { useMatchWeights } from "@/lib/store/match-weights";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import type { Country, StudentProfile } from "@/lib/data/types";

const COUNTRY_OPTIONS: Country[] = ["USA", "Kazakhstan", "China"];

function UniversityMatchBody({ profile }: { profile: StudentProfile }) {
  const { setProfile } = useProfile();
  const router = useRouter();
  const { openDrawer } = useAdvisorUi();
  const { result: matchResult } = useMatchWeights();
  // Captured once on mount (lazy initializer) so later scenario edits can be diffed against the starting point.
  const [baselineSignature] = useState(() => JSON.stringify(profile));

  const [scenario, setScenario] = useState<StudentProfile>(profile);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { savedIds } = useSavedPrograms();
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const result = useMemo(
    () => getRecommendations(scenario, universities, programs, matchResult.weights),
    [scenario, matchResult.weights]
  );
  const changed = JSON.stringify(scenario) !== baselineSignature;
  const visibleRecommendations = showSavedOnly
    ? result.recommendations.filter((rec) => savedIds.includes(rec.program.id))
    : result.recommendations;

  function updateScenario(next: StudentProfile) {
    setScenario(next);
    setProfile(next);
  }

  function toggleCountry(country: Country) {
    const has = scenario.countryPreferences.includes(country);
    const countryPreferences = has
      ? scenario.countryPreferences.filter((c) => c !== country)
      : [...scenario.countryPreferences, country];
    updateScenario({ ...scenario, countryPreferences });
  }

  function toggleSelect(programId: string) {
    setSelectedIds((ids) =>
      ids.includes(programId) ? ids.filter((id) => id !== programId) : ids.length < 3 ? [...ids, programId] : ids
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ink">University Match</h1>
          <p className="mt-2 text-ink-soft">Ranked by fit to your profile — not a universal ranking.</p>
        </div>
        <Button variant="secondary" onClick={() => openDrawer("analysis")}>
          Open AI Advisor
        </Button>
      </div>

      <Card padding="md" className="mt-6 flex flex-col gap-4">
        <p className="text-xs font-medium text-ink-faint">What if…</p>
        <div className="flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map((country) => (
            <Chip key={country} selected={scenario.countryPreferences.includes(country)} onClick={() => toggleCountry(country)}>
              {country}
            </Chip>
          ))}
        </div>
        <div className="max-w-xs">
          <Input
            label="Budget per year (USD)"
            type="number"
            min={0}
            value={String(scenario.budgetPerYearUSD)}
            onChange={(e) => updateScenario({ ...scenario, budgetPerYearUSD: Number(e.target.value) || 0 })}
          />
        </div>
        {changed && (
          <p className="text-sm font-medium text-ink" role="status">
            Your path changed — matches below reflect your new answers.
          </p>
        )}
      </Card>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-faint">
          {visibleRecommendations.length} program{visibleRecommendations.length === 1 ? "" : "s"}
        </h2>
        <Chip selected={showSavedOnly} onClick={() => setShowSavedOnly((v) => !v)} className="text-xs">
          Saved only {savedIds.length > 0 ? `(${savedIds.length})` : ""}
        </Chip>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {visibleRecommendations.length === 0 && (
          <Card padding="md">
            <p className="text-ink-soft">
              {showSavedOnly
                ? "You haven't saved any programs yet — tap \"Save\" on a card below to add one."
                : "No programs match those filters in this build's dataset. Try widening your countries or budget above."}
            </p>
          </Card>
        )}
        {visibleRecommendations.map((rec) => (
          <RecommendationCard
            key={rec.program.id}
            recommendation={rec}
            selected={selectedIds.includes(rec.program.id)}
            onToggleSelect={() => toggleSelect(rec.program.id)}
          />
        ))}
      </div>

      {result.excluded.length > 0 && (
        <p className="mt-6 text-sm text-ink-faint">
          {result.excluded.length} other program{result.excluded.length === 1 ? "" : "s"} in the dataset didn&apos;t
          meet your hard constraints (field, country, or budget ceiling).
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl justify-end gap-3 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:px-6">
          <Button variant="secondary" disabled={selectedIds.length < 2} onClick={() => router.push(`/compare?ids=${selectedIds.join(",")}`)}>
            Compare selected ({selectedIds.length})
          </Button>
          <Button onClick={() => router.push("/roadmap")}>Build my roadmap</Button>
        </div>
      </div>
    </div>
  );
}

export default function UniversityMatchPage() {
  return <RequireProfile>{(profile) => <UniversityMatchBody profile={profile} />}</RequireProfile>;
}
