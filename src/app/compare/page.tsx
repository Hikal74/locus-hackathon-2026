"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VerificationBadge } from "@/components/ui/Badge";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import { useMatchWeights } from "@/lib/store/match-weights";
import type { StudentProfile } from "@/lib/data/types";

function CompareContent({ profile }: { profile: StudentProfile }) {
  const params = useSearchParams();
  const { result: matchResult } = useMatchWeights();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const { recommendations } = getRecommendations(profile, universities, programs, matchResult.weights);
  const selected = recommendations.filter((r) => ids.includes(r.program.id));

  if (selected.length < 2) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-ink-soft">Select at least 2 programs from your university matches to compare.</p>
        <Link href="/universities" className="mt-4 inline-block">
          <Button>Back to university matches</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold text-ink">Compare your options</h1>
      <p className="mt-2 text-ink-soft">
        These are tradeoffs, not a ranking — read the watch-outs before deciding which fits you best.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="w-40 text-left text-xs font-medium text-ink-faint" />
              {selected.map((rec) => (
                <th key={rec.program.id} className="px-3 pb-3 text-left align-top">
                  <p className="text-xs text-ink-faint">{rec.university.country}</p>
                  <p className="text-base font-semibold text-ink">{rec.university.name}</p>
                  <p className="text-sm text-ink-soft">{rec.program.name}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            <Row label="Fit score">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>{rec.fitScore}%</Cell>
              ))}
            </Row>
            <Row label="Tuition / year">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>
                  <div className="flex items-center gap-2">
                    <span>${rec.program.tuitionPerYearUSD.value.toLocaleString()}</span>
                    <VerificationBadge status={rec.program.tuitionPerYearUSD.status} />
                  </div>
                </Cell>
              ))}
            </Row>
            <Row label="Selectivity">
              {selected.map((rec) => (
                <Cell key={rec.program.id} className="capitalize">
                  {rec.program.selectivity.replace("_", " ")}
                </Cell>
              ))}
            </Row>
            <Row label="Min. GPA (4.0)">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>
                  {rec.program.minGpaOn4Scale ? (
                    <div className="flex items-center gap-2">
                      <span>{rec.program.minGpaOn4Scale.value.toFixed(1)}</span>
                      <VerificationBadge status={rec.program.minGpaOn4Scale.status} />
                    </div>
                  ) : (
                    "Not published"
                  )}
                </Cell>
              ))}
            </Row>
            <Row label="Language requirements">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>
                  {rec.program.languageRequirements.map((r) => (
                    <div key={`${r.language}-${r.test}`}>
                      {r.language}
                      {r.test && r.test !== "none" ? ` — ${r.test} ${r.minScore ?? ""}` : ""}
                    </div>
                  ))}
                </Cell>
              ))}
            </Row>
            <Row label="Next deadline">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>
                  {rec.program.deadlines[0] ? `${rec.program.deadlines[0].label}: ${rec.program.deadlines[0].date}` : "—"}
                </Cell>
              ))}
            </Row>
            <Row label="Scholarships">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>
                  {rec.program.scholarships.map((s) => (
                    <div key={s.name}>
                      {s.name} — {s.coverage}
                    </div>
                  ))}
                </Cell>
              ))}
            </Row>
            <Row label="Research emphasis">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>{rec.program.researchOpportunities ? "Yes" : "Limited"}</Cell>
              ))}
            </Row>
            <Row label="Watch out">
              {selected.map((rec) => (
                <Cell key={rec.program.id}>
                  {rec.watchOut.length === 0 ? "Nothing flagged" : rec.watchOut.map((w) => <div key={w}>• {w}</div>)}
                </Cell>
              ))}
            </Row>
          </tbody>
        </table>
      </div>

      <Card padding="md" className="mt-8">
        <p className="text-sm text-ink-soft">
          No single option is objectively &quot;best&quot; here — {selected[0].university.name} scores higher on fit to your
          stated preferences, while the others may suit you better if your budget, country priority, or research
          interest shifts. Use the what-if controls on the recommendations page to test that.
        </p>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t-2 border-line-soft">
      <th scope="row" className="whitespace-nowrap py-3 pr-3 text-left align-top text-xs font-medium text-ink-faint">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`min-w-[220px] px-3 py-3 align-top text-ink-soft ${className ?? ""}`}>{children}</td>;
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-16 text-center text-ink-faint">Loading…</div>}>
      <RequireProfile>{(profile) => <CompareContent profile={profile} />}</RequireProfile>
    </Suspense>
  );
}
