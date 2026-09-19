import { VerificationBadge } from "@/components/ui/Badge";
import type { SourcedFact } from "@/lib/data/types";

/** "What they look for" — a university's stated applicant traits. Shared by RecommendationCard and Compare. */
export function ValuesSought({ valuesSought }: { valuesSought?: SourcedFact<string[]> }) {
  if (!valuesSought) return null;
  return (
    <div>
      <VerificationBadge status={valuesSought.status} />
      <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-soft">
        {valuesSought.value.map((v) => (
          <li key={v}>• {v}</li>
        ))}
      </ul>
    </div>
  );
}
