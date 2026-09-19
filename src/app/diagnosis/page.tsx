"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WarningIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { buildDiagnosis } from "@/lib/engine/diagnosis";
import { FIELD_LABELS } from "@/lib/data/labels";
import type { StudentProfile } from "@/lib/data/types";

// The profile form defaults budget to an effectively-unlimited value; showing "$1,000,000/yr" would be noise.
const UNLIMITED_BUDGET = 1_000_000;

function SnapshotTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-5 py-4">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="break-words text-base font-semibold text-ink">
        {value}
      </dd>
    </div>
  );
}

function snapshot(profile: StudentProfile): { label: string; value: string }[] {
  return [
    { label: "Studying", value: FIELD_LABELS[profile.intendedField] },
    { label: "Countries", value: profile.countryPreferences.join(", ") || "Not chosen" },
    {
      label: "Budget",
      value: profile.budgetPerYearUSD >= UNLIMITED_BUDGET ? "No limit set" : `$${profile.budgetPerYearUSD.toLocaleString("en-US")}/yr`,
    },
    { label: "Intake", value: profile.intendedIntake },
    { label: "GPA (4.0)", value: profile.gpaOn4Scale != null ? profile.gpaOn4Scale.toFixed(1) : "Not provided" },
  ];
}

function DiagnosisBody({ profile }: { profile: StudentProfile }) {
  const diagnosis = buildDiagnosis(profile);
  const tiles = snapshot(profile);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title="Your diagnosis" description={diagnosis.goal} />

      <Card padding="none" className="mt-8 overflow-hidden">
        <dl className="grid grid-cols-2 divide-x divide-y divide-line-soft sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
          {tiles.map((t) => (
            <SnapshotTile key={t.label} {...t} />
          ))}
        </dl>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card padding="md">
          <h2 className="font-semibold text-ink">Strengths</h2>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink-soft">
            {diagnosis.strengths.length === 0 && <li>Nothing confirmed yet — add more detail on your profile.</li>}
            {diagnosis.strengths.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </Card>
        <Card padding="md">
          <h2 className="font-semibold text-ink">Constraints</h2>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink-soft">
            {diagnosis.constraints.length === 0 && <li>No major constraints identified from your answers.</li>}
            {diagnosis.constraints.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </Card>
      </div>

      {diagnosis.gaps.length > 0 && (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-ink-faint p-6">
          <h2 className="flex items-center gap-2 font-semibold text-ink">
            <WarningIcon width={16} height={16} /> Important gaps
          </h2>
          <ul className="mt-3 flex flex-col gap-2.5 text-sm text-ink-soft">
            {diagnosis.gaps.map((g) => (
              <li key={g}>• {g}</li>
            ))}
          </ul>
        </div>
      )}

      <Card padding="lg" className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">What&apos;s next</h2>
          <p className="mt-1 text-sm text-ink-soft">See the programs that fit this profile, or jump straight to your plan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/roadmap">
            <Button variant="secondary">Build my roadmap</Button>
          </Link>
          <Link href="/universities">
            <Button size="lg">See my university matches</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function DiagnosisPage() {
  return <RequireProfile>{(profile) => <DiagnosisBody profile={profile} />}</RequireProfile>;
}
