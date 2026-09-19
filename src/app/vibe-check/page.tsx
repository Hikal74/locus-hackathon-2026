import { SparkIcon } from "@/components/ui/icons";
import { VibeCheckTool } from "@/components/vibecheck/VibeCheckTool";

export default function VibeCheckPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2">
        <SparkIcon width={20} height={20} />
        <h1 className="text-3xl font-semibold text-ink">Professor Vibe Check</h1>
      </div>
      <p className="mt-2 text-ink-soft">
        Paste public reviews, a past syllabus, or grade numbers for an instructor — get a quick read on their
        teaching style, like &ldquo;heavy reader, but gives amazing feedback&rdquo; or &ldquo;exam-heavy, strict
        attendance.&rdquo; Every rating shows the evidence behind it, and anything your sources don&apos;t cover
        is marked as unknown rather than guessed. No profile needed.
      </p>

      <div className="mt-8">
        <VibeCheckTool />
      </div>
    </div>
  );
}
