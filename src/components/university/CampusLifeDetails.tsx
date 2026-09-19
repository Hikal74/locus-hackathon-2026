import { VerificationBadge } from "@/components/ui/Badge";
import type { CampusLife } from "@/lib/data/types";

/** "Campus & City Life" — cost of living, housing, neighborhood, social climate. Shared by RecommendationCard and Compare. */
export function CampusLifeDetails({ campusLife }: { campusLife?: CampusLife }) {
  if (!campusLife) return null;
  const { costOfLivingPerMonthUSD, onCampusHousing, offCampusHousingNote, neighborhoodNote, socialClimateNote } = campusLife;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink-soft">Cost of living:</span>
        <span className="text-ink-soft">~${costOfLivingPerMonthUSD.value.toLocaleString()}/month</span>
        <VerificationBadge status={costOfLivingPerMonthUSD.status} />
        <span className="text-xs text-ink-faint">(excludes tuition)</span>
      </div>

      <div>
        <p className="font-medium text-ink-soft">On-campus housing</p>
        {onCampusHousing.available ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {onCampusHousing.priceRangePerYearUSD ? (
              <>
                <span className="text-ink-soft">
                  ${onCampusHousing.priceRangePerYearUSD.value[0].toLocaleString()}–$
                  {onCampusHousing.priceRangePerYearUSD.value[1].toLocaleString()}/yr
                </span>
                <VerificationBadge status={onCampusHousing.priceRangePerYearUSD.status} />
              </>
            ) : (
              <span className="text-ink-faint">Available — exact price not confirmed</span>
            )}
          </div>
        ) : (
          <span className="text-ink-faint">Not available</span>
        )}
        {onCampusHousing.note && <p className="mt-1 text-xs text-ink-faint">{onCampusHousing.note}</p>}
      </div>

      <p>
        <span className="font-medium text-ink-soft">Off-campus: </span>
        <span className="text-ink-soft">{offCampusHousingNote}</span>
      </p>
      <p>
        <span className="font-medium text-ink-soft">Neighborhood: </span>
        <span className="text-ink-soft">{neighborhoodNote}</span>
      </p>
      <p>
        <span className="font-medium text-ink-soft">Social climate: </span>
        <span className="text-ink-soft">{socialClimateNote}</span>
      </p>
    </div>
  );
}
