"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RequireProfile } from "@/components/layout/RequireProfile";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WarningIcon, ArrowLeftIcon } from "@/components/ui/icons";
import { weightsFromRanking, weightsFromDuelTally } from "@/lib/engine/personalize";
import type { FactorKey } from "@/lib/engine/types";
import { useMatchWeights } from "@/lib/store/match-weights";
import type { StudentProfile } from "@/lib/data/types";
import { cn } from "@/lib/utils/cn";

const OPENER = "Let's figure out what matters most to you. To start: would you rather save money, or get into the most selective program you can?";

const REQUIRED_EXCHANGES = 3;

type Turn = { role: "user" | "assistant"; content: string };

/** Binary questions used when the AI advisor isn't configured — same method, no Gemini call needed. */
const FALLBACK_QUESTIONS: { prompt: string; a: { label: string; factor: FactorKey }; b: { label: string; factor: FactorKey } }[] = [
  {
    prompt: "Which matters more to you?",
    a: { label: "Keeping costs low", factor: "budget" },
    b: { label: "The most selective program I can get into", factor: "academic" },
  },
  {
    prompt: "Which matters more to you?",
    a: { label: "Studying in my top-choice country", factor: "location" },
    b: { label: "The specific program content, wherever it is", factor: "interest" },
  },
  {
    prompt: "Which matters more to you?",
    a: { label: "Being fully ready for requirements right now", factor: "requirements" },
    b: { label: "Campus size, research emphasis, scholarships", factor: "preferences" },
  },
];

function FallbackQuiz({ onDone }: { onDone: (weights: Record<FactorKey, number>) => void }) {
  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState<Partial<Record<FactorKey, number>>>({});

  const question = FALLBACK_QUESTIONS[index];

  function pick(factor: FactorKey) {
    const nextTally = { ...tally, [factor]: (tally[factor] ?? 0) + 1 };
    if (index + 1 >= FALLBACK_QUESTIONS.length) {
      onDone(weightsFromDuelTally(nextTally));
      return;
    }
    setTally(nextTally);
    setIndex((i) => i + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-ink bg-surface p-3 text-sm text-ink">
        <WarningIcon width={16} height={16} className="mt-0.5 shrink-0" />
        The AI advisor isn&apos;t configured in this deployment, so here&apos;s the same method as a quick quiz instead.
      </div>
      <p className="text-lg font-medium text-ink">{question.prompt}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card interactive padding="md" onClick={() => pick(question.a.factor)}>
          {question.a.label}
        </Card>
        <Card interactive padding="md" onClick={() => pick(question.b.factor)}>
          {question.b.label}
        </Card>
      </div>
      <p className="text-xs text-ink-faint">
        Question {index + 1} of {FALLBACK_QUESTIONS.length}
      </p>
    </div>
  );
}

function InterviewChat({ profile }: { profile: StudentProfile }) {
  const router = useRouter();
  const { setMatchResult } = useMatchWeights();
  const [turns, setTurns] = useState<Turn[]>([{ role: "assistant", content: OPENER }]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  function finish(weights: Record<FactorKey, number>) {
    setMatchResult("interview", weights);
    router.push("/recommendations");
  }

  async function submit() {
    const trimmed = draft.trim();
    if (!trimmed || loading) return;
    setDraft("");
    const nextTurns = [...turns, { role: "user" as const, content: trimmed }];
    setTurns(nextTurns);
    const nextExchangeCount = exchangeCount + 1;
    setExchangeCount(nextExchangeCount);
    setLoading(true);

    try {
      if (nextExchangeCount >= REQUIRED_EXCHANGES) {
        const res = await fetch("/api/priorities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: nextTurns }),
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok || !data || typeof data !== "object" || !("order" in data)) {
          setFallback(true);
          setLoading(false);
          return;
        }
        finish(weightsFromRanking((data as { order: FactorKey[] }).order));
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          messages: nextTurns.map(({ role, content }) => ({
            role,
            content: role === "assistant" ? `${content} (Ask ONE short follow-up question to learn more about what this student prioritizes when choosing a university — don't answer on their behalf.)` : content,
          })),
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data !== "object" || !("reply" in data)) {
        setFallback(true);
        setLoading(false);
        return;
      }
      setTurns([...nextTurns, { role: "assistant", content: (data as { reply: string }).reply }]);
    } catch {
      setFallback(true);
    } finally {
      setLoading(false);
    }
  }

  if (fallback) {
    return <FallbackQuiz onDone={finish} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {turns.map((t, i) => (
          <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm",
                t.role === "user" ? "bg-ink text-on-primary" : "border border-line bg-surface text-ink"
              )}
            >
              {t.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-ink-faint">Thinking…</p>}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Type your answer…"
          className="flex-1 rounded-[var(--radius-sm)] border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:shadow-[var(--ring-focus)] focus-visible:border-ink"
        />
        <Button onClick={submit} disabled={loading || !draft.trim()}>
          Send
        </Button>
      </div>
      <p className="text-xs text-ink-faint">
        {Math.min(exchangeCount, REQUIRED_EXCHANGES)} of {REQUIRED_EXCHANGES} exchanges
      </p>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <RequireProfile>
      {(profile) => (
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <Link href="/match" className="inline-flex items-center gap-1 text-sm text-ink-faint hover:text-ink">
            <ArrowLeftIcon width={14} height={14} /> Back to methods
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-ink">Interview</h1>
          <p className="mt-3 text-ink-soft">
            A few quick questions from the AI advisor, then we turn what you said into your priority order.
          </p>
          <div className="mt-8">
            <InterviewChat profile={profile} />
          </div>
        </div>
      )}
    </RequireProfile>
  );
}
