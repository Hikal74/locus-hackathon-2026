"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { WarningIcon } from "@/components/ui/icons";
import { useAdvisor } from "@/lib/ai/use-advisor";
import type { StudentProfile } from "@/lib/data/types";

interface AdvisorPanelProps {
  profile: StudentProfile;
}

function Section({ title, items }: { title: string; items: string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <ul className="flex flex-col gap-1.5 text-sm text-ink-soft">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The Full Analysis tab of the global advisor drawer: a lazily-fetched,
 * structured analysis grounded in the current scenario, plus a lightweight
 * follow-up chat. On failure, shows a real error state with a retry button —
 * never a deterministic-template answer standing in for a failed AI call.
 * See docs/AI_USAGE.md.
 */
export function AdvisorPanel({ profile }: AdvisorPanelProps) {
  const {
    analysis,
    sources,
    status,
    errorMessage,
    questions,
    hasRun,
    profileChangedSinceLastRun,
    runInitial,
    askFollowUp,
    retry,
  } = useAdvisor(profile);
  const [question, setQuestion] = useState("");

  const loading = status === "loading";

  function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setQuestion("");
    askFollowUp(trimmed);
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Gemini reasons over your full profile and a relevant slice of our university database — it&apos;s not a
          template, and it can be wrong, so anything it flags to verify is worth actually checking.
        </p>
        <Badge tone="accent" className="shrink-0">
          Gemini
        </Badge>
      </div>

      {!hasRun && status !== "error" && (
        <Button onClick={() => runInitial()} disabled={loading}>
          {loading ? "Analyzing your profile…" : "Get full analysis"}
        </Button>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-surface p-4">
          <p className="flex items-start gap-2 text-sm text-ink">
            <WarningIcon width={16} height={16} className="mt-0.5 shrink-0" />
            {errorMessage ?? "Something went wrong."}
          </p>
          <Button variant="secondary" size="sm" onClick={retry} disabled={loading} className="self-start">
            {loading ? "Retrying…" : "Retry"}
          </Button>
        </div>
      )}

      {profileChangedSinceLastRun && hasRun && (
        <p className="text-sm font-medium text-ink" role="status">
          Your profile changed since this analysis ran.{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => runInitial()} disabled={loading}>
            Refresh analysis
          </button>
        </p>
      )}

      {analysis && (
        <div className="flex flex-col gap-5 border-t border-line pt-5">
          <p className="text-ink">{analysis.summary}</p>

          {analysis.profileAnalysis && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-ink">Profile overview</p>
              <p className="text-sm text-ink-soft">{analysis.profileAnalysis}</p>
            </div>
          )}

          <Section title="Strengths / existing evidence" items={analysis.strengths} />

          {analysis.universityAnalysis && analysis.universityAnalysis.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-ink">University / program analysis</p>
              <div className="flex flex-col gap-3">
                {analysis.universityAnalysis.map((entry) => {
                  const source = sources.find((s) => s.programId === entry.programId);
                  return (
                    <div key={entry.programId} className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-3">
                      <p className="text-sm font-medium text-ink">
                        {source ? `${source.universityName} — ${source.programName}` : entry.programId}
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">{entry.analysis}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Section title="Areas to develop" items={analysis.developmentAreas} />
          <Section title="Recommended next actions" items={analysis.recommendedActions} />
          <Section title="Important information to verify" items={analysis.verifyBeforeRelying} />
          <Section title="Open questions" items={analysis.questionsOrMissingInformation} />

          {sources.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <p className="text-xs font-medium text-ink-faint">Based on our university database</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((s) => (
                  <a key={s.programId} href={s.universityWebsiteUrl} target="_blank" rel="noreferrer" className="inline-flex">
                    <Badge tone="neutral">{s.universityName}</Badge>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <p className="text-xs font-medium text-ink-faint">Ask a follow-up</p>
            {questions.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-ink-faint">
                {questions.map((q, i) => (
                  <li key={i}>Asked: &ldquo;{q}&rdquo;</li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Follow-up question"
                  placeholder="e.g. What if I target China instead?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitQuestion();
                    }
                  }}
                />
              </div>
              <Button onClick={submitQuestion} disabled={loading || !question.trim()} className="self-end">
                {loading ? "Asking…" : "Ask"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
