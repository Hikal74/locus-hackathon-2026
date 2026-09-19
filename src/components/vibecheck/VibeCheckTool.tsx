"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { WarningIcon } from "@/components/ui/icons";
import { VibeResult } from "@/components/vibecheck/VibeResult";
import { useVibeCheck } from "@/lib/ai/use-vibecheck";

const EXAMPLE_SOURCES = `Review 1: Tons of reading every week, easily 80-100 pages, but her comments on my essays were the most useful feedback I've had. Office hours are actually helpful.
Review 2: Grade is basically two exams and a final. Attendance is checked every lecture and you lose marks after 3 absences.
Review 3: Fair but demanding. Lectures are a bit dry. The syllabus says participation is 10% of the grade.`;

export function VibeCheckTool() {
  const [label, setLabel] = useState("");
  const [sources, setSources] = useState("");
  const { result, status, errorMessage, check, retry } = useVibeCheck();
  const loading = status === "loading";

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-4">
        <Input
          label="Professor or course (optional)"
          placeholder="e.g. Intro to Economics"
          maxLength={120}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Textarea
          label="Paste reviews, syllabus text, or grade distributions"
          placeholder="Paste student reviews, a syllabus excerpt, grade numbers — the more, the better the picture."
          rows={8}
          maxLength={12000}
          value={sources}
          onChange={(e) => setSources(e.target.value)}
          hint={`${sources.length}/12000 — Vibe Check only reads what you paste here.`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => check({ label, sources })} disabled={loading || !sources.trim()}>
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
      </Card>

      {status === "error" && (
        <Card padding="md" className="flex flex-col gap-3">
          <p className="flex items-start gap-2 text-sm text-ink">
            <WarningIcon width={16} height={16} className="mt-0.5 shrink-0" />
            {errorMessage ?? "Something went wrong."}
          </p>
          <Button variant="secondary" size="sm" onClick={retry} className="self-start">
            Retry
          </Button>
        </Card>
      )}

      {result && (
        <Card padding="lg">
          <VibeResult result={result} />
        </Card>
      )}
    </div>
  );
}
