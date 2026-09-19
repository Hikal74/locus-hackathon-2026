"use client";

import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { FIT_TIER_LABEL, type FitTier } from "@/lib/engine/tiers";
import type { Country } from "@/lib/data/types";

export type TierFilter = "all" | FitTier;

interface FilterSidebarProps {
  countryOptions: Country[];
  selectedCountries: Country[];
  onToggleCountry: (country: Country) => void;
  budget: number;
  onBudgetChange: (value: number) => void;
  tier: TierFilter;
  onTierChange: (tier: TierFilter) => void;
  tierCounts: Record<TierFilter, number>;
  savedOnly: boolean;
  savedCount: number;
  onToggleSavedOnly: () => void;
  changed: boolean;
  onReset: () => void;
}

function Group({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line-soft py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

const TIER_ORDER: TierFilter[] = ["all", "reach", "match", "safety", "unknown"];

/** Grouped filters, Studyportals/BigFuture style: what you're changing is always labeled and one column wide. */
export function FilterSidebar(props: FilterSidebarProps) {
  const { tierCounts } = props;

  return (
    <div className="flex flex-col">
      <Group title="Countries" hint="Where you'd consider studying">
        <div className="flex flex-wrap gap-2">
          {props.countryOptions.map((country) => (
            <Chip
              key={country}
              selected={props.selectedCountries.includes(country)}
              onClick={() => props.onToggleCountry(country)}
              className="text-xs"
            >
              {country}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Budget" hint="Tuition per year, USD">
        <div className="[&_label]:sr-only">
          <Input
            label="Budget per year (USD)"
            type="number"
            min={0}
            value={String(props.budget)}
            onChange={(e) => props.onBudgetChange(Number(e.target.value) || 0)}
          />
        </div>
      </Group>

      <Group title="Reach / match / safety" hint="Your GPA vs. each program's published minimum — not an admission prediction">
        <div className="flex flex-wrap gap-2">
          {TIER_ORDER.filter((t) => t === "all" || tierCounts[t] > 0).map((t) => (
            <Chip key={t} selected={props.tier === t} onClick={() => props.onTierChange(t)} className="text-xs">
              {t === "all" ? "All" : FIT_TIER_LABEL[t]} ({tierCounts[t]})
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Show">
        <div className="flex flex-wrap gap-2">
          <Chip selected={props.savedOnly} onClick={props.onToggleSavedOnly} className="text-xs">
            Saved only{props.savedCount > 0 ? ` (${props.savedCount})` : ""}
          </Chip>
        </div>
      </Group>

      {props.changed && (
        <div className="mt-5 flex flex-col gap-2 rounded-[var(--radius-md)] border border-dashed border-ink-faint p-3" role="status">
          <p className="text-xs text-ink-soft">Your path changed — matches reflect your new answers.</p>
          <button
            type="button"
            onClick={props.onReset}
            className="self-start text-xs font-semibold text-ink underline underline-offset-2"
          >
            Reset to my profile
          </button>
        </div>
      )}
    </div>
  );
}
