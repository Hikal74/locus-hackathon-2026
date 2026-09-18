"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChevronRightIcon } from "@/components/ui/icons";
import { useMatchWeights } from "@/lib/store/match-weights";

const METHODS = [
  {
    href: "/match/duels",
    title: "Duels",
    tag: "Quick",
    description:
      "Pick between head-to-head program matchups. Every choice you make nudges which of the six fit factors matters most to you.",
  },
  {
    href: "/match/rank",
    title: "Rank",
    tag: "Direct",
    description: "Drag the six fit factors into the order you actually care about — most important first.",
  },
  {
    href: "/match/map",
    title: "Fit Map",
    tag: "Visual",
    description:
      "Move six live weight sliders and watch every eligible program reposition on a scatter plot in real time.",
  },
  {
    href: "/match/interview",
    title: "Interview",
    tag: "Guided",
    description:
      "Talk it through with the AI advisor — it asks a few questions, then turns what you said into your priority order.",
  },
];

export default function MatchPage() {
  const router = useRouter();
  const { reset } = useMatchWeights();

  return (
    <RequireProfile>
      {() => (
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <p className="text-sm font-medium text-ink-faint">Step 3 of 7</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">How do you want to find your matches?</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Pathlight&apos;s matching engine weighs six factors — academic fit, interest fit, budget fit, requirement
            readiness, location fit, and preference fit. Pick how you&apos;d like to tell us which of those matter
            most to you.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {METHODS.map((method) => (
              <Link key={method.href} href={method.href} className="block">
                <Card interactive padding="lg" className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-ink">{method.title}</h2>
                    <Badge tone="accent">{method.tag}</Badge>
                  </div>
                  <p className="flex-1 text-sm text-ink-soft">{method.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-ink">
                    Start <ChevronRightIcon width={16} height={16} />
                  </span>
                </Card>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              reset();
              router.push("/recommendations");
            }}
            className="mt-8 text-sm text-ink-faint underline underline-offset-2 hover:text-ink"
          >
            Skip — use balanced default weights
          </button>
        </div>
      )}
    </RequireProfile>
  );
}
