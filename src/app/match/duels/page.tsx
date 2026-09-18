"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { universities, programs } from "@/lib/data/dataset";
import { generateDuels, type Duel, type DuelSide } from "@/lib/engine/duels";
import { weightsFromDuelTally } from "@/lib/engine/personalize";
import type { FactorKey } from "@/lib/engine/types";
import { useMatchWeights } from "@/lib/store/match-weights";
import type { StudentProfile } from "@/lib/data/types";

function DuelCard({ side, onPick }: { side: DuelSide; onPick: () => void }) {
  return (
    <Card interactive padding="lg" onClick={onPick} className="flex h-full flex-col gap-3">
      <p className="text-lg font-semibold text-ink">{side.program.name}</p>
      <ul className="flex flex-col gap-1.5 text-sm text-ink-soft">
        {side.facts.map((fact) => (
          <li key={fact}>• {fact}</li>
        ))}
      </ul>
    </Card>
  );
}

function DuelFlow({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const { setMatchResult } = useMatchWeights();
  const duels = useMemo<Duel[]>(() => generateDuels(profile, universities, programs), [profile]);
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState<Partial<Record<FactorKey, number>>>({});

  if (duels.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-soft">
          We couldn&apos;t build enough head-to-head matchups from your current field/country selection. Try another
          method instead.
        </p>
        <Link href="/match" className="text-sm font-medium text-ink underline underline-offset-2">
          Back to methods
        </Link>
      </div>
    );
  }

  if (index >= duels.length) {
    const weights = weightsFromDuelTally(tally);
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink-soft">
          That&apos;s all {duels.length} duels. We&apos;ll use what you picked to weigh your matches.
        </p>
        <Button
          onClick={() => {
            setMatchResult("duels", weights);
            router.push("/recommendations");
          }}
        >
          See my matches
        </Button>
      </div>
    );
  }

  const duel = duels[index];

  function pick(factor: FactorKey) {
    setTally((prev) => ({ ...prev, [factor]: (prev[factor] ?? 0) + 1 }));
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <Progress label={`Duel ${index + 1} of ${duels.length}`} value={((index + 1) / duels.length) * 100} />
      <p className="text-xl font-medium text-ink">{duel.prompt}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <DuelCard side={duel.left} onPick={() => pick(duel.factor)} />
        <DuelCard side={duel.right} onPick={() => pick(duel.factor)} />
      </div>
    </div>
  );
}

export default function DuelsPage() {
  return (
    <RequireProfile>
      {(profile) => (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link href="/match" className="inline-flex items-center gap-1 text-sm text-ink-faint hover:text-ink">
            <ArrowLeftIcon width={14} height={14} /> Back to methods
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Pick the one you&apos;d choose</h1>
          <p className="mt-3 text-ink-soft">
            Facts only — no scores. Go with your gut; each pick tells us a little about what matters most to you.
          </p>
          <div className="mt-8">
            <DuelFlow profile={profile} />
          </div>
        </div>
      )}
    </RequireProfile>
  );
}
