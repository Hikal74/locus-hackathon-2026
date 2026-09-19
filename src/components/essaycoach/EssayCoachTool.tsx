"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { WarningIcon } from "@/components/ui/icons";
import { EssayCoachResultView } from "@/components/essaycoach/EssayCoachResult";
import { useAiRequest } from "@/lib/ai/use-ai-request";
import { ESSAY_MAX_LENGTH, ESSAY_MIN_LENGTH, type EssayCoachRequest, type EssayCoachResult } from "@/lib/ai/essaycoach-schema";

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

export function EssayCoachTool() {
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const { result, status, errorMessage, run, retry } = useAiRequest<EssayCoachRequest, EssayCoachResult>(
    "/api/essaycoach",
    "Couldn't reach Essay Coach. Check your connection and try again."
  );
  const loading = status === "loading";
  const tooShort = essay.trim().length < ESSAY_MIN_LENGTH;

  return (
    <div className="flex flex-col gap-6">
      <Card padding="lg" className="flex flex-col gap-4">
        <Input
          label="Essay prompt (optional)"
          placeholder="e.g. Describe a challenge you overcame and what you learned."
          maxLength={1000}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Textarea
          label="Your draft"
          placeholder="Paste your essay draft here…"
          rows={12}
          maxLength={ESSAY_MAX_LENGTH}
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          hint={`${wordCount(essay)} words · ${essay.length}/${ESSAY_MAX_LENGTH} characters. Sent to Google's Gemini API to generate feedback; Pathlight doesn't store it.`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => run({ essay, prompt: prompt.trim() || undefined })} disabled={loading || tooShort}>
            {loading ? "Reading your draft…" : "Get feedback"}
          </Button>
          {tooShort && essay.length > 0 && (
            <span className="text-xs text-ink-faint">A few more sentences, please — at least {ESSAY_MIN_LENGTH} characters.</span>
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
        <Card padding="lg">
          <EssayCoachResultView result={result} />
        </Card>
      )}
    </div>
  );
}
