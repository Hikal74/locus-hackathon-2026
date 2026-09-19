import { SparkIcon } from "@/components/ui/icons";
import { EssayCoachTool } from "@/components/essaycoach/EssayCoachTool";

export default function EssayCoachPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2">
        <SparkIcon width={20} height={20} />
        <h1 className="text-3xl font-semibold text-ink">Essay Coach</h1>
      </div>
      <p className="mt-2 text-ink-soft">
        Paste a draft of your application essay and get honest feedback on clarity, specificity, voice, and structure —
        with the exact passages it&apos;s talking about. It coaches; it never writes or rewrites your essay for you.
      </p>

      <div className="mt-8">
        <EssayCoachTool />
      </div>
    </div>
  );
}
