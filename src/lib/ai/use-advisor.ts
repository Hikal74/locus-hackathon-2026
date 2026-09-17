"use client";

import { useCallback, useRef, useState } from "react";
import type { StudentProfile } from "@/lib/data/types";

export interface AdvisorSource {
  programId: string;
  universityName: string;
  programName: string;
  universityWebsiteUrl: string;
}

export interface AdvisorAnalysis {
  summary: string;
  profileAnalysis?: string;
  universityAnalysis?: { programId: string; analysis: string }[];
  strengths?: string[];
  developmentAreas?: string[];
  recommendedActions?: string[];
  questionsOrMissingInformation?: string[];
  verifyBeforeRelying?: string[];
  databaseSourcesUsed?: string[];
}

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

type AdvisorStatus = "idle" | "loading" | "error";

/** Bounds how much prior conversation is resent per follow-up — see docs/AI_USAGE.md §13. */
const MAX_HISTORY_TURNS_SENT = 6;

/**
 * Drives the AI advisor panel: an initial full analysis, plus lightweight
 * follow-up questions that build on a condensed conversation history rather
 * than resending the whole thing. Never falls back to a canned answer on
 * failure — `status === "error"` is a real, surfaced failure state.
 */
export function useAdvisor(profile: StudentProfile) {
  const [analysis, setAnalysis] = useState<AdvisorAnalysis | null>(null);
  const [sources, setSources] = useState<AdvisorSource[]>([]);
  const [status, setStatus] = useState<AdvisorStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const historyRef = useRef<HistoryTurn[]>([]);
  const lastQuestionRef = useRef<string | undefined>(undefined);
  // State, not a ref: profileChangedSinceLastRun is derived from this during
  // render, and refs can't be read during render (react-hooks/refs).
  const [lastRunSignature, setLastRunSignature] = useState<string | null>(null);

  const currentSignature = JSON.stringify(profile);
  const profileChangedSinceLastRun = lastRunSignature !== null && lastRunSignature !== currentSignature;

  const run = useCallback(
    async (question?: string) => {
      lastQuestionRef.current = question;
      setStatus("loading");
      setErrorMessage(null);

      try {
        const res = await fetch("/api/advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            question,
            history: historyRef.current.slice(-MAX_HISTORY_TURNS_SENT),
          }),
        });

        const data: unknown = await res.json().catch(() => null);

        if (!res.ok || !data || typeof data !== "object") {
          const message =
            data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Something went wrong. Please try again.";
          setStatus("error");
          setErrorMessage(message);
          return;
        }

        const { analysis: nextAnalysis, sources: nextSources } = data as {
          analysis: AdvisorAnalysis;
          sources: AdvisorSource[];
        };

        setAnalysis(nextAnalysis);
        setSources(nextSources ?? []);
        setStatus("idle");
        setLastRunSignature(JSON.stringify(profile));

        if (question) {
          historyRef.current = [
            ...historyRef.current,
            { role: "user", content: question },
            { role: "assistant", content: nextAnalysis.summary },
          ];
          setQuestions((qs) => [...qs, question]);
        } else {
          historyRef.current = [{ role: "assistant", content: nextAnalysis.summary }];
          setQuestions([]);
        }
      } catch {
        setStatus("error");
        setErrorMessage("Couldn't reach the AI advisor. Check your connection and try again.");
      }
    },
    [profile]
  );

  return {
    analysis,
    sources,
    status,
    errorMessage,
    questions,
    hasRun: analysis != null,
    profileChangedSinceLastRun,
    runInitial: () => run(),
    askFollowUp: (question: string) => run(question),
    retry: () => run(lastQuestionRef.current),
  };
}
