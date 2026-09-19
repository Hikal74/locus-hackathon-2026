import { Chip } from "@/components/ui/Chip";
import type { Country } from "@/lib/data/types";
import { toggle } from "../step-utils";
import type { StepProps } from "../types";

const COUNTRY_OPTIONS: Country[] = ["USA", "Kazakhstan", "China"];

export function CountriesStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Where are you considering?</h1>
      <p className="text-sm text-ink-soft">
        Tap countries in order of preference — the order affects how we rank otherwise-similar matches.
      </p>
      <div className="flex flex-wrap gap-2">
        {COUNTRY_OPTIONS.map((country) => {
          const rank = draft.countryPreferences.indexOf(country);
          return (
            <Chip
              key={country}
              selected={rank !== -1}
              onClick={() => update("countryPreferences", toggle(draft.countryPreferences, country))}
            >
              {rank !== -1 ? `${rank + 1}. ` : ""}
              {country}
            </Chip>
          );
        })}
      </div>
    </>
  );
}
