"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { WarningIcon } from "@/components/ui/icons";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { buildDiagnosis } from "@/lib/engine/diagnosis";

export default function DiagnosisPage() {
  return (
    <RequireProfile>
      {(profile) => {
        const diagnosis = buildDiagnosis(profile);
        return (
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-semibold text-ink">Your diagnosis</h1>
            <p className="mt-2 text-ink-soft">{diagnosis.goal}</p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Card padding="md">
                <h2 className="font-semibold text-ink">Strengths</h2>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
                  {diagnosis.strengths.length === 0 && <li>Nothing confirmed yet — add more detail on your profile.</li>}
                  {diagnosis.strengths.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              </Card>
              <Card padding="md">
                <h2 className="font-semibold text-ink">Constraints</h2>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
                  {diagnosis.constraints.length === 0 && <li>No major constraints identified from your answers.</li>}
                  {diagnosis.constraints.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </Card>
            </div>

            {diagnosis.gaps.length > 0 && (
              <Card padding="md" className="mt-6">
                <h2 className="flex items-center gap-2 font-semibold text-ink">
                  <WarningIcon width={16} height={16} /> Important gaps
                </h2>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-soft">
                  {diagnosis.gaps.map((g) => (
                    <li key={g}>• {g}</li>
                  ))}
                </ul>
              </Card>
            )}

            <Card padding="md" className="mt-6">
              <h2 className="font-semibold text-ink">Readiness</h2>
              <p className="mt-1 text-xs text-ink-faint">
                This reflects how much of your profile is filled in — not an admission probability.
              </p>
              <div className="mt-4 flex flex-col gap-4">
                {diagnosis.readiness.map((r) => (
                  <Progress key={r.label} label={r.label} value={r.value} />
                ))}
              </div>
            </Card>

            <div className="mt-8 flex justify-end">
              <Link href="/match">
                <Button size="lg">Choose how to find my matches</Button>
              </Link>
            </div>
          </div>
        );
      }}
    </RequireProfile>
  );
}
