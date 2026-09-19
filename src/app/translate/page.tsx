import { SparkIcon } from "@/components/ui/icons";
import { DebureaucratizeTool } from "@/components/translate/DebureaucratizeTool";

export default function TranslatePage() {
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

      <div className="mt-8">
        <DebureaucratizeTool />
      </div>
    </div>
  );
}
