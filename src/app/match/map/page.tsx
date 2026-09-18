"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { universities, programs } from "@/lib/data/dataset";
import { getRecommendations } from "@/lib/engine/recommend";
import type { Recommendation, FactorKey } from "@/lib/engine/types";
import { FACTOR_LABELS, FACTOR_ORDER, weightsFromSliders } from "@/lib/engine/personalize";
import { useMatchWeights } from "@/lib/store/match-weights";
import type { StudentProfile } from "@/lib/data/types";

const WIDTH = 640;
const HEIGHT = 360;
const PAD_LEFT = 56;
const PAD_BOTTOM = 36;
const PAD_TOP = 32;
const PAD_RIGHT = 16;

function initialSliders(): Record<FactorKey, number> {
  const base = {} as Record<FactorKey, number>;
  FACTOR_ORDER.forEach((k) => (base[k] = 50));
  return base;
}

function FitScatter({ profile, sliders }: { profile: StudentProfile; sliders: Record<FactorKey, number> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const weights = useMemo(() => weightsFromSliders(sliders), [sliders]);
  const recommendations = useMemo<Recommendation[]>(
    () => getRecommendations(profile, universities, programs, weights).recommendations,
    [profile, weights]
  );

  const maxTuition = Math.max(1, ...recommendations.map((r) => r.program.tuitionPerYearUSD.value));
  const xDomain = maxTuition * 1.1;
  const scaleX = (v: number) => PAD_LEFT + (v / xDomain) * (WIDTH - PAD_LEFT - PAD_RIGHT);
  const scaleY = (v: number) => HEIGHT - PAD_BOTTOM - (v / 100) * (HEIGHT - PAD_BOTTOM - PAD_TOP);

  const selected = recommendations.find((r) => r.program.id === selectedId) ?? null;
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round((xDomain * f) / 1000) * 1000);
  const yTicks = [0, 25, 50, 75, 100];

  if (recommendations.length === 0) {
    return <p className="text-ink-soft">No eligible programs to plot for your current field/country/budget selection.</p>;
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Tuition versus fit score for your eligible programs"
        className="w-full"
      >
        {yTicks.map((t) => (
          <g key={`y-${t}`}>
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={scaleY(t)} y2={scaleY(t)} stroke="var(--color-line-soft)" strokeWidth={1} />
            <text x={PAD_LEFT - 10} y={scaleY(t)} textAnchor="end" dominantBaseline="middle" className="fill-ink-faint text-[10px]">
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x-${t}`} x={scaleX(t)} y={HEIGHT - PAD_BOTTOM + 18} textAnchor="middle" className="fill-ink-faint text-[10px]">
            ${Math.round(t / 1000)}k
          </text>
        ))}
        <line x1={PAD_LEFT} x2={PAD_LEFT} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-ink)" strokeWidth={2} />
        <line
          x1={PAD_LEFT}
          x2={WIDTH - PAD_RIGHT}
          y1={HEIGHT - PAD_BOTTOM}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="var(--color-ink)"
          strokeWidth={2}
        />
        <text x={PAD_LEFT} y={HEIGHT - 4} className="fill-ink-soft text-[11px] font-medium">
          Tuition / year
        </text>
        <text x={4} y={16} className="fill-ink-soft text-[11px] font-medium">
          Fit score
        </text>

        {recommendations.map((rec) => {
          const cx = scaleX(rec.program.tuitionPerYearUSD.value);
          const cy = scaleY(rec.fitScore);
          const isSelected = rec.program.id === selectedId;
          return (
            <g
              key={rec.program.id}
              tabIndex={0}
              role="button"
              aria-label={`${rec.university.name} — ${rec.program.name}, fit score ${rec.fitScore}`}
              onClick={() => setSelectedId(rec.program.id)}
              onFocus={() => setSelectedId(rec.program.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedId(rec.program.id);
              }}
              className="cursor-pointer outline-none"
            >
              <circle cx={cx} cy={cy} r={14} fill="transparent" />
              <circle cx={cx} cy={cy} r={isSelected ? 9 : 6} fill="var(--color-paper)" />
              <circle cx={cx} cy={cy} r={isSelected ? 7 : 5} fill="var(--color-ink)" />
              {isSelected && (
                <text x={cx + 12} y={cy + 4} className="fill-ink text-[11px] font-semibold">
                  {rec.university.name.length > 22 ? `${rec.university.name.slice(0, 20)}…` : rec.university.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <Card padding="sm" className="mt-4">
        {selected ? (
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-ink">
              {selected.university.name} — {selected.program.name}
            </p>
            <p className="text-sm text-ink-soft">
              ${selected.program.tuitionPerYearUSD.value.toLocaleString()}/yr · {selected.university.country} · fit score{" "}
              {selected.fitScore}/100
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-faint">Click or tab to a point to see details.</p>
        )}
      </Card>
    </div>
  );
}

function FitMapFlow({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const { setMatchResult } = useMatchWeights();
  const [sliders, setSliders] = useState<Record<FactorKey, number>>(initialSliders);
  const weights = useMemo(() => weightsFromSliders(sliders), [sliders]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-col gap-4 lg:w-56 lg:shrink-0">
          {FACTOR_ORDER.map((key) => (
            <Slider
              key={key}
              label={FACTOR_LABELS[key]}
              min={0}
              max={100}
              value={sliders[key]}
              valueLabel={`${Math.round(weights[key] * 100)}%`}
              onChange={(e) => setSliders((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
            />
          ))}
        </div>
        <div className="flex-1">
          <FitScatter profile={profile} sliders={sliders} />
        </div>
      </div>

      <Button
        onClick={() => {
          setMatchResult("map", weights);
          router.push("/recommendations");
        }}
        className="self-start"
      >
        Use these weights
      </Button>
    </div>
  );
}

export default function FitMapPage() {
  return (
    <RequireProfile>
      {(profile) => (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <Link href="/match" className="inline-flex items-center gap-1 text-sm text-ink-faint hover:text-ink">
            <ArrowLeftIcon width={14} height={14} /> Back to methods
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Fit Map</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Move the sliders — every eligible program repositions live. No inference here: the sliders are your
            weights.
          </p>
          <div className="mt-8">
            <FitMapFlow profile={profile} />
          </div>
        </div>
      )}
    </RequireProfile>
  );
}
