"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { FilterSidebar, type TierFilter } from "@/components/recommendations/FilterSidebar";
import { CompareTray } from "@/components/recommendations/CompareTray";
import { PageHeader } from "@/components/layout/PageHeader";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { useAdvisorUi } from "@/components/advisor/advisor-context";
import { useProfile } from "@/lib/store/profile-context";
import { useSavedPrograms } from "@/lib/store/saved-programs";
import { useMatchWeights } from "@/lib/store/match-weights";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import { getFitTier, type FitTier } from "@/lib/engine/tiers";
import { SORT_OPTIONS, sortRecommendations, type SortKey } from "@/lib/engine/recommendation-sort";
import { toLocalIsoDate } from "@/lib/engine/deadlines";
import type { Country, StudentProfile } from "@/lib/data/types";

const COUNTRY_OPTIONS: Country[] = ["USA", "Kazakhstan", "China"];

function UniversityMatchBody({ profile }: { profile: StudentProfile }) {
  const { setProfile } = useProfile();
  const { openDrawer } = useAdvisorUi();
  const { result: matchResult } = useMatchWeights();
  // Captured once on mount (lazy initializer) so later scenario edits can be diffed against, and reset to, the starting point.
  const [baseline] = useState(() => profile);
  const [todayIso] = useState(() => toLocalIsoDate(new Date()));

  const [scenario, setScenario] = useState<StudentProfile>(profile);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { savedIds } = useSavedPrograms();
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("fit");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const result = useMemo(
    () => getRecommendations(scenario, universities, programs, matchResult.weights),
    [scenario, matchResult.weights]
  );
  const changed = JSON.stringify(scenario) !== JSON.stringify(baseline);

  const tiers = useMemo(
    () => new Map(result.recommendations.map((rec) => [rec.program.id, getFitTier(scenario, rec.program).tier])),
    [result.recommendations, scenario]
  );

  const scoped = showSavedOnly ? result.recommendations.filter((rec) => savedIds.includes(rec.program.id)) : result.recommendations;
  const tierCounts = useMemo(() => {
    const counts: Record<TierFilter, number> = { all: scoped.length, reach: 0, match: 0, safety: 0, unknown: 0 };
    for (const rec of scoped) counts[tiers.get(rec.program.id) as FitTier] += 1;
    return counts;
  }, [scoped, tiers]);

  const visible = useMemo(() => {
    const filtered = tierFilter === "all" ? scoped : scoped.filter((rec) => tiers.get(rec.program.id) === tierFilter);
    return sortRecommendations(filtered, sortKey, todayIso);
  }, [scoped, tiers, tierFilter, sortKey, todayIso]);

  const activeFilterCount = (showSavedOnly ? 1 : 0) + (tierFilter !== "all" ? 1 : 0) + (changed ? 1 : 0);

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

  function resetFilters() {
    updateScenario(baseline);
    setShowSavedOnly(false);
    setTierFilter("all");
  }

  const sidebar = (
    <FilterSidebar
      countryOptions={COUNTRY_OPTIONS}
      selectedCountries={scenario.countryPreferences}
      onToggleCountry={toggleCountry}
      budget={scenario.budgetPerYearUSD}
      onBudgetChange={(value) => updateScenario({ ...scenario, budgetPerYearUSD: value })}
      tier={tierFilter}
      onTierChange={setTierFilter}
      tierCounts={tierCounts}
      savedOnly={showSavedOnly}
      savedCount={savedIds.length}
      onToggleSavedOnly={() => setShowSavedOnly((v) => !v)}
      changed={changed}
      onReset={resetFilters}
    />
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-10 sm:px-6">
      <PageHeader
        title="University match"
        description="Ranked by fit to your profile — not a universal ranking."
        actions={
          <Button variant="secondary" onClick={() => openDrawer("analysis")}>
            Ask the AI advisor
          </Button>
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="lg:hidden">
            <Button variant="secondary" className="w-full" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
              {filtersOpen ? "Hide filters" : `Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
            </Button>
          </div>
          <Card padding="md" className={filtersOpen ? "mt-3 block lg:mt-0" : "hidden lg:block"}>
            {sidebar}
          </Card>
        </aside>

        <section aria-label="Results" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft" aria-live="polite">
              <span className="font-semibold text-ink">{visible.length}</span> program{visible.length === 1 ? "" : "s"}
              {result.excluded.length > 0 && (
                <span className="text-ink-faint"> · {result.excluded.length} filtered out by your constraints</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-faint" aria-hidden="true">
                Sort by
              </span>
              <div className="w-44 [&_label]:sr-only">
                <Select
                  label="Sort by"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  options={SORT_OPTIONS}
                  className="py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {visible.length === 0 && (
              <Card padding="lg" className="flex flex-col items-start gap-3">
                <p className="font-semibold text-ink">No programs match these filters.</p>
                <p className="text-sm text-ink-soft">
                  {showSavedOnly && savedIds.length === 0
                    ? "You haven't saved any programs yet — tap the heart on a card to add one."
                    : "Try widening your countries or budget, or clearing the tier filter."}
                </p>
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Reset filters
                </Button>
              </Card>
            )}
            {visible.map((rec) => (
              <RecommendationCard
                key={rec.program.id}
                recommendation={rec}
                selected={selectedIds.includes(rec.program.id)}
                onToggleSelect={() => toggleSelect(rec.program.id)}
              />
            ))}
          </div>
        </section>
      </div>

      <CompareTray selectedIds={selectedIds} />
    </div>
  );
}

export default function UniversityMatchPage() {
  return <RequireProfile>{(profile) => <UniversityMatchBody profile={profile} />}</RequireProfile>;
}
