import { Textarea } from "@/components/ui/Textarea";
import type { StepProps } from "../types";

export function AdditionalContextStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Anything else worth knowing? (optional)</h1>
      <p className="text-sm text-ink-soft">
        Projects, competitions, research, leadership, awards, volunteering, career goals, or anything else about
        your situation. This isn&apos;t scored by the matching algorithm above — it goes straight to the AI advisor,
        which reads it and reasons about it directly, so write in your own words instead of trying to fit a form
        field.
      </p>
      <Textarea
        label="In your own words"
        placeholder="e.g. Built a machine-learning project that placed top 3 in a national science fair; captain of the robotics club; want to eventually work in AI research but worried my portfolio is thin outside of coursework…"
        rows={6}
        maxLength={4000}
        value={draft.additionalContext}
        onChange={(e) => update("additionalContext", e.target.value)}
        hint={`${draft.additionalContext.length}/4000`}
      />
    </>
  );
}
