"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeftIcon, WarningIcon } from "@/components/ui/icons";
import { useDebureaucratize } from "@/lib/ai/use-debureaucratize";
import { cn } from "@/lib/utils/cn";

const EXAMPLE_TEXT =
  "Applicants who have not yet satisfied the minimum English language proficiency requirement at the time of application submission may be granted conditional admission, contingent upon subsequent attainment of the requisite score prior to the commencement of the academic term for which they have been admitted; failure to furnish such evidence by the stipulated deadline shall result in deferral of enrollment to a subsequent intake period.";

function Panel({ compact, className, children }: { compact: boolean; className?: string; children: React.ReactNode }) {
  if (compact) return <div className={className}>{children}</div>;
  return (
    <Card padding="lg" className={className}>
      {children}
    </Card>
  );
}

/** compact = flat, tight layout for the home-page tile; otherwise the full-page card layout. */
export function DebureaucratizeTool({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState("");
  const { result, status, errorMessage, translate, retry, reset } = useDebureaucratize();
  const loading = status === "loading";

  // In a square tile the form fills the window, so a result below it would be invisible: swap views instead.
  if (compact && result) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="secondary" size="sm" onClick={reset} className="flex items-center gap-1.5 self-start">
          <ArrowLeftIcon width={14} height={14} />
          Translate another
        </Button>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">In plain language</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{result.plainText}</p>
        </div>
        {result.terms && result.terms.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Key terms explained</p>
            <div className="mt-3 flex flex-col gap-3">
              {result.terms.map((t) => (
                <div key={t.term}>
                  <Badge tone="accent">{t.term}</Badge>
                  <p className="mt-1.5 text-sm text-ink-soft">{t.definition}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-6")}>
      <Panel compact={compact} className="flex flex-col gap-4">
        <Textarea
          label="Paste the text"
          placeholder="Paste a paragraph from an admissions page, a policy document, anything formal…"
          rows={compact ? 4 : 7}
          maxLength={8000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          hint={compact ? undefined : `${text.length}/8000`}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button size={compact ? "sm" : "md"} onClick={() => translate(text)} disabled={loading || !text.trim()}>
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
        <>
          <Panel compact={compact}>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">In plain language</p>
            <p className="mt-3 whitespace-pre-wrap text-ink">{result.plainText}</p>
          </Panel>

          {result.terms && result.terms.length > 0 && (
            <Panel compact={compact}>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Key terms explained</p>
              <div className="mt-3 flex flex-col gap-3">
                {result.terms.map((t) => (
                  <div key={t.term}>
                    <Badge tone="accent">{t.term}</Badge>
                    <p className="mt-1.5 text-sm text-ink-soft">{t.definition}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
