import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import type { Language } from "@/lib/data/types";
import type { StepProps } from "../types";

const LANGUAGE_OPTIONS: Language[] = ["English", "Chinese", "Kazakh", "Russian"];

export function LanguagesStep({ draft, update }: StepProps) {
  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">What languages do you speak?</h1>
      <Input
        label="Native language (optional)"
        placeholder="e.g. Kazakh"
        value={draft.nativeLanguage}
        onChange={(e) => update("nativeLanguage", e.target.value)}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink-soft">Preferred language of instruction (optional)</span>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <Chip
              key={lang}
              selected={draft.languageOfInstruction === lang}
              onClick={() => update("languageOfInstruction", draft.languageOfInstruction === lang ? "" : lang)}
            >
              {lang}
            </Chip>
          ))}
        </div>
      </div>
    </>
  );
}
