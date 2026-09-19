"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { WarningIcon } from "@/components/ui/icons";
import { useAiRequest } from "@/lib/ai/use-ai-request";
import {
  INTERVIEW_ANSWER_MAX_LENGTH,
  INTERVIEW_ANSWER_MIN_LENGTH,
  type InterviewRequest,
  type InterviewResult,
} from "@/lib/ai/interview-schema";
import { getInterviewQuestions } from "@/lib/data/interview-questions";
import { useProfile } from "@/lib/store/profile-context";

interface ActiveQuestion {
  text: string;
  lookFor?: string;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{children}</p>;
}

export function InterviewTool() {
  const { profile } = useProfile();
  const questions = getInterviewQuestions(profile?.intendedField);
  const [index, setIndex] = useState(0);
  const [custom, setCustom] = useState<ActiveQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const { result, status, errorMessage, run, retry, reset } = useAiRequest<InterviewRequest, InterviewResult>(
    "/api/interview",
    "Couldn't reach interview practice. Check your connection and try again."
  );
  const loading = status === "loading";

  const base = questions[index % questions.length];
  const active: ActiveQuestion = custom ?? { text: base.question, lookFor: base.lookFor };
  const tooShort = answer.trim().length < INTERVIEW_ANSWER_MIN_LENGTH;

  function startFresh(next: ActiveQuestion | null, nextIndex: number) {
    setCustom(next);
    setIndex(nextIndex);
    setAnswer("");
    reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-4">
        <div>
          <Heading>{custom ? "Follow-up question" : `Question ${(index % questions.length) + 1} of ${questions.length}`}</Heading>
          <p className="mt-2 text-xl font-semibold text-ink">{active.text}</p>
          {active.lookFor && <p className="mt-2 text-sm text-ink-soft">What interviewers usually listen for: {active.lookFor}</p>}
        </div>

        <Textarea
          label="Your answer"
          placeholder="Answer as you would out loud — a real example beats a general statement."
          rows={8}
          maxLength={INTERVIEW_ANSWER_MAX_LENGTH}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          hint={`${answer.length}/${INTERVIEW_ANSWER_MAX_LENGTH} characters. Sent to Google's Gemini API to generate feedback; Pathlight doesn't store it.`}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => run({ question: active.text, answer })} disabled={loading || tooShort}>
            {loading ? "Reading your answer…" : "Get feedback"}
          </Button>
          <Button variant="secondary" onClick={() => startFresh(null, custom ? index : index + 1)} disabled={loading}>
            {custom ? "Back to the question list" : "Different question"}
          </Button>
          {tooShort && answer.length > 0 && (
            <span className="text-xs text-ink-faint">Say a bit more — at least {INTERVIEW_ANSWER_MIN_LENGTH} characters.</span>
          )}
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
        <Card padding="lg" className="flex flex-col gap-5">
          <div>
            <Heading>Overall</Heading>
            <p className="mt-2 text-lg font-semibold text-ink">{result.summary}</p>
          </div>

          {result.strengths.length > 0 && (
            <div>
              <Heading>What worked</Heading>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.improvements.length > 0 && (
            <div>
              <Heading>To improve</Heading>
              <ol className="mt-2 list-decimal pl-5 text-sm text-ink-soft">
                {result.improvements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-line-soft pt-4">
            <Heading>An interviewer might ask next</Heading>
            <p className="text-sm text-ink">{result.followUpQuestion}</p>
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => startFresh({ text: result.followUpQuestion }, index)}
            >
              Practice this follow-up
            </Button>
          </div>

          <p className="flex items-start gap-2 rounded-[var(--radius-sm)] border border-dashed border-ink-faint p-3 text-xs text-ink-soft">
            <WarningIcon width={14} height={14} className="mt-0.5 shrink-0" />
            <span>
              Feedback is based only on what you wrote. It never supplies an answer for you, and it isn&apos;t a prediction of
              how any interviewer will respond.
            </span>
          </p>
        </Card>
      )}
    </div>
  );
}
