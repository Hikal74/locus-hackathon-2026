"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ArrowLeftIcon, WarningIcon } from "@/components/ui/icons";
import { VibeResult } from "@/components/vibecheck/VibeResult";
import { useVibeCheck } from "@/lib/ai/use-vibecheck";
import { cn } from "@/lib/utils/cn";

const EXAMPLE_SOURCES = `Review 1: Tons of reading every week, easily 80-100 pages, but her comments on my essays were the most useful feedback I've had. Office hours are actually helpful.
Review 2: Grade is basically two exams and a final. Attendance is checked every lecture and you lose marks after 3 absences.
Review 3: Fair but demanding. Lectures are a bit dry. The syllabus says participation is 10% of the grade.`;

function Panel({ compact, className, children }: { compact: boolean; className?: string; children: React.ReactNode }) {
  if (compact) return <div className={className}>{children}</div>;
  return (
    <Card padding="lg" className={className}>
      {children}
    </Card>
  );
}

/** compact = flat, tight layout for the home-page tile; otherwise the full-page card layout. */
export function VibeCheckTool({ compact = false }: { compact?: boolean }) {
  const [label, setLabel] = useState("");
  const [sources, setSources] = useState("");
  const { result, status, errorMessage, check, retry, reset } = useVibeCheck();
  const loading = status === "loading";

  // In a square tile the form fills the window, so a result below it would be invisible: swap views instead.
  if (compact && result) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="secondary" size="sm" onClick={reset} className="flex items-center gap-1.5 self-start">
          <ArrowLeftIcon width={14} height={14} />
          Check another
        </Button>
        <VibeResult result={result} compact />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-6")}>
      <Panel compact={compact} className="flex flex-col gap-4">
        {!compact && (
          <Input
            label="Professor or course (optional)"
            placeholder="e.g. Intro to Economics"
            maxLength={120}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        )}
        <Textarea
          label={compact ? "Paste reviews, syllabus, or grades" : "Paste reviews, syllabus text, or grade distributions"}
          placeholder="Paste student reviews, a syllabus excerpt, grade numbers — the more, the better the picture."
          rows={compact ? 4 : 8}
          maxLength={12000}
          value={sources}
          onChange={(e) => setSources(e.target.value)}
          hint={compact ? undefined : `${sources.length}/12000 — Vibe Check only reads what you paste here.`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button size={compact ? "sm" : "md"} onClick={() => check({ label, sources })} disabled={loading || !sources.trim()}>
            {loading ? "Reading…" : "Check the vibe"}
          </Button>
          <button
            type="button"
            onClick={() => setSources(EXAMPLE_SOURCES)}
            className="text-sm text-ink-faint underline underline-offset-2 hover:text-ink"
          >
            Try an example
          </button>
        </div>
      </Panel>

      {status === "error" && (
        <Panel compact={compact} className={cn("flex flex-col gap-3", compact && "order-first")}>
          <p className="flex items-start gap-2 text-sm text-ink">
            <WarningIcon width={16} height={16} className="mt-0.5 shrink-0" />
            {errorMessage ?? "Something went wrong."}
          </p>
          <Button variant="secondary" size="sm" onClick={retry} className="self-start">
            Retry
          </Button>
        </Panel>
      )}

      {result && (
        <Panel compact={compact}>
          <VibeResult result={result} compact={compact} />
        </Panel>
      )}
    </div>
  );
}
