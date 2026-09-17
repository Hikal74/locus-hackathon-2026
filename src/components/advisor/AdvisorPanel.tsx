"use client";

import { useState } from "react";
import { ClayBadge } from "@/components/clay/ClayBadge";
import { ClayButton } from "@/components/clay/ClayButton";
import { ClayCard } from "@/components/clay/ClayCard";
import { ClayInput } from "@/components/clay/ClayInput";
import { useAdvisor } from "@/lib/ai/use-advisor";
import type { StudentProfile } from "@/lib/data/types";

interface AdvisorPanelProps {
  profile: StudentProfile;
}

function Section({ title, items }: { title: string; items: string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">{title}</p>
      <ul className="flex flex-col gap-1.5 text-sm text-ink-soft">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The AI advisor's UI: a lazily-fetched, structured analysis grounded in the
 * current scenario (profile plus any What-If edits above it), plus a
 * lightweight follow-up chat. On failure, shows a real error state with a
 * retry button — never a deterministic-template answer standing in for a
 * failed AI call. See docs/AI_USAGE.md.
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
    <ClayCard padding="lg" className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">AI Advisor Analysis</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Gemini reasons over your full profile and a relevant slice of our university database — it&apos;s not a
            template, and it can be wrong, so anything it flags to verify is worth actually checking.
          </p>
        </div>
        <ClayBadge tone="accent" className="shrink-0">
          Gemini
        </ClayBadge>
      </div>

      {!hasRun && status !== "error" && (
        <ClayButton onClick={() => runInitial()} disabled={loading}>
          {loading ? "Analyzing your profile…" : "Get AI Advisor Analysis"}
        </ClayButton>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-danger/10 p-4">
          <p className="text-sm text-danger">{errorMessage ?? "Something went wrong."}</p>
          <ClayButton variant="secondary" size="sm" onClick={retry} disabled={loading}>
            {loading ? "Retrying…" : "Retry"}
          </ClayButton>
        </div>
      )}

      {profileChangedSinceLastRun && hasRun && (
        <p className="text-sm font-medium text-primary" role="status">
          Your profile changed since this analysis ran.{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => runInitial()} disabled={loading}>
            Refresh analysis
          </button>
        </p>
      )}

      {analysis && (
        <div className="flex flex-col gap-5 border-t border-[var(--color-border)] pt-5">
          <p className="text-ink">{analysis.summary}</p>

          {analysis.profileAnalysis && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink">Profile overview</p>
              <p className="text-sm text-ink-soft">{analysis.profileAnalysis}</p>
            </div>
          )}

          <Section title="Strengths / existing evidence" items={analysis.strengths} />

          {analysis.universityAnalysis && analysis.universityAnalysis.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-ink">University / program analysis</p>
              <div className="flex flex-col gap-3">
                {analysis.universityAnalysis.map((entry) => {
                  const source = sources.find((s) => s.programId === entry.programId);
                  return (
                    <div key={entry.programId} className="rounded-[var(--radius-md)] bg-surface-raised p-3">
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
            <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
              <p className="text-xs font-medium text-ink-faint">Based on our university database</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((s) => (
                  <a
                    key={s.programId}
                    href={s.universityWebsiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <ClayBadge tone="neutral">{s.universityName}</ClayBadge>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
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
                <ClayInput
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
              <ClayButton onClick={submitQuestion} disabled={loading || !question.trim()} className="self-end">
                {loading ? "Asking…" : "Ask"}
              </ClayButton>
            </div>
          </div>
        </div>
      )}
    </ClayCard>
  );
}
