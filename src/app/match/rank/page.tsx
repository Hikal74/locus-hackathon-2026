"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon, GripIcon } from "@/components/ui/icons";
import { FACTOR_DESCRIPTIONS, FACTOR_LABELS, FACTOR_ORDER, weightsFromRanking } from "@/lib/engine/personalize";
import type { FactorKey } from "@/lib/engine/types";
import { useMatchWeights } from "@/lib/store/match-weights";
import Link from "next/link";

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function RankPage() {
  const router = useRouter();
  const { setMatchResult } = useMatchWeights();
  const [order, setOrder] = useState<FactorKey[]>(FACTOR_ORDER);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function confirm() {
    setMatchResult("rank", weightsFromRanking(order));
    router.push("/recommendations");
  }

  return (
    <RequireProfile>
      {() => (
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Link href="/match" className="inline-flex items-center gap-1 text-sm text-ink-faint hover:text-ink">
            <ArrowLeftIcon width={14} height={14} /> Back to methods
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Rank what matters most</h1>
          <p className="mt-3 text-ink-soft">
            Drag, or use the arrows, to put these in the order you actually care about — most important at the top.
          </p>

          <ol className="mt-8 flex flex-col gap-3">
            {order.map((key, index) => (
              <li key={key}>
                <Card
                  padding="sm"
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) return;
                    setOrder((prev) => move(prev, dragIndex, index));
                    setDragIndex(null);
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-semibold">
                    {index + 1}
                  </span>
                  <GripIcon width={16} height={16} className="shrink-0 cursor-grab text-ink-faint" />
                  <div className="flex-1">
                    <p className="font-medium text-ink">{FACTOR_LABELS[key]}</p>
                    <p className="text-xs text-ink-faint">{FACTOR_DESCRIPTIONS[key]}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      aria-label={`Move ${FACTOR_LABELS[key]} up`}
                      disabled={index === 0}
                      onClick={() => setOrder((prev) => move(prev, index, index - 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] border border-ink disabled:opacity-30"
                    >
                      <ChevronUpIcon width={14} height={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${FACTOR_LABELS[key]} down`}
                      disabled={index === order.length - 1}
                      onClick={() => setOrder((prev) => move(prev, index, index + 1))}
                      className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] border border-ink disabled:opacity-30"
                    >
                      <ChevronDownIcon width={14} height={14} />
                    </button>
                  </div>
                </Card>
              </li>
            ))}
          </ol>

          <Button onClick={confirm} className="mt-8">
            Use this ranking
          </Button>
        </div>
      )}
    </RequireProfile>
  );
}
