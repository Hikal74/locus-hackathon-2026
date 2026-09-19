import Link from "next/link";
import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TierBadge } from "@/components/insights/TierBadge";
import { ExampleButton } from "@/components/landing/ExampleButton";
import { universities, programs } from "@/lib/data/dataset";
import { FIELD_LABELS } from "@/lib/data/labels";
import { sampleProfile } from "@/lib/data/sample-profile";
import { getRecommendations } from "@/lib/engine/recommend";
import { getFitTier } from "@/lib/engine/tiers";

const TOP_N = 3;

/**
 * The product itself, not a mockup: the real engine run on the bundled sample student, so the numbers, reasons,
 * and watch-outs here are exactly what that student would see after taking the test.
 */
export function ProductPreview() {
  const p = sampleProfile;
  const { recommendations } = getRecommendations(p, universities, programs);
  const top = recommendations.slice(0, TOP_N);

  const facts = [
    [p.age && p.grade ? `${p.age}, ${p.grade}` : null, "Student"],
    [FIELD_LABELS[p.intendedField], "Wants to study"],
    [p.countryPreferences.join(", "), "Considering"],
    [`$${p.budgetPerYearUSD.toLocaleString("en-US")} / year`, "Budget"],
    [p.gpaOn4Scale != null ? `${p.gpaOn4Scale.toFixed(1)} on a 4.0 scale` : null, "GPA"],
    [
      `${Object.values(p.languageLevel).join(", ") || "None yet"}${p.standardizedExamsCompleted.length === 0 ? " · no SAT yet" : ""}`,
      "Exams",
    ],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Card padding="md" className="flex flex-col gap-5 self-start">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Sample student</p>
          <p className="mt-1 text-lg font-semibold text-ink">Here&apos;s who these matches are for</p>
        </div>
        <dl className="flex flex-col divide-y divide-line-soft">
          {facts.map(([value, label]) =>
            value ? (
              <div key={label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0">
                <dt className="text-xs text-ink-faint">{label}</dt>
                <dd className="text-right text-sm font-medium text-ink">{value}</dd>
              </div>
            ) : null
          )}
        </dl>
        <p className="text-xs text-ink-faint">
          Real output from the same engine you&apos;d use — not a mockup. {recommendations.length} programs survived the
          filters; the top {top.length} are below.
        </p>
      </Card>

      <div className="flex flex-col gap-4">
        {top.map((rec, i) => {
          const tier = getFitTier(p, rec.program);
          return (
            <Card key={rec.program.id} padding="md" className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink-soft">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-faint">
                      {rec.university.country} · {rec.university.city}
                    </p>
                    <h3 className="text-lg font-semibold leading-tight text-ink">{rec.university.name}</h3>
                    <p className="mt-0.5 text-sm text-ink-soft">{rec.program.name}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-3xl font-semibold leading-none tabular-nums text-ink">{rec.fitScore}%</p>
                  <p className="mt-1 text-xs text-ink-faint">fit</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <TierBadge result={tier} />
                <Badge tone="neutral">${rec.program.tuitionPerYearUSD.value.toLocaleString("en-US")} / yr</Badge>
                <VerificationBadge status={rec.program.tuitionPerYearUSD.status} compact />
              </div>

              <div className="grid gap-4 border-t border-line-soft pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-ink-faint">Why it fits</p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-soft">
                    {rec.whyItFits.slice(0, 2).map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-faint">Watch out</p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-sm text-ink-soft">
                    {rec.watchOut.length === 0 ? (
                      <li>Nothing flagged for this student.</li>
                    ) : (
                      rec.watchOut.slice(0, 2).map((w) => <li key={w}>• {w}</li>)
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/profile">
            <Button size="lg">Get my own matches</Button>
          </Link>
          <ExampleButton />
        </div>
      </div>
    </div>
  );
}
