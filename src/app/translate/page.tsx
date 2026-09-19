"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { WarningIcon, SparkIcon } from "@/components/ui/icons";
import { useDebureaucratize } from "@/lib/ai/use-debureaucratize";

const EXAMPLE_TEXT =
  "Applicants who have not yet satisfied the minimum English language proficiency requirement at the time of application submission may be granted conditional admission, contingent upon subsequent attainment of the requisite score prior to the commencement of the academic term for which they have been admitted; failure to furnish such evidence by the stipulated deadline shall result in deferral of enrollment to a subsequent intake period.";

export default function TranslatePage() {
  const [text, setText] = useState("");
  const { result, status, errorMessage, translate, retry } = useDebureaucratize();
  const loading = status === "loading";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2">
        <SparkIcon width={20} height={20} />
        <h1 className="text-3xl font-semibold text-ink">De-Bureaucratizer</h1>
      </div>
      <p className="mt-2 text-ink-soft">
        Paste an admissions requirement, a financial-aid clause, anything written in dense formal or academic
        language — get it back in plain English, plus a short glossary of any jargon. No profile needed.
      </p>

      <Card padding="lg" className="mt-8 flex flex-col gap-4">
        <Textarea
          label="Paste the text"
          placeholder="Paste a paragraph from an admissions page, a policy document, anything formal…"
          rows={7}
          maxLength={8000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          hint={`${text.length}/8000`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => translate(text)} disabled={loading || !text.trim()}>
            {loading ? "Translating…" : "Translate"}
          </Button>
          <button
            type="button"
            onClick={() => setText(EXAMPLE_TEXT)}
            className="text-sm text-ink-faint underline underline-offset-2 hover:text-ink"
          >
            Try an example
          </button>
        </div>
      </Card>

      {status === "error" && (
        <Card padding="md" className="mt-6 flex flex-col gap-3">
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
        <div className="mt-6 flex flex-col gap-6">
          <Card padding="lg">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">In plain language</p>
            <p className="mt-3 whitespace-pre-wrap text-ink">{result.plainText}</p>
          </Card>

          {result.terms && result.terms.length > 0 && (
            <Card padding="lg">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Key terms explained</p>
              <div className="mt-3 flex flex-col gap-3">
                {result.terms.map((t) => (
                  <div key={t.term}>
                    <Badge tone="accent">{t.term}</Badge>
                    <p className="mt-1.5 text-sm text-ink-soft">{t.definition}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
