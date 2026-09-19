import { SparkIcon } from "@/components/ui/icons";
import { InterviewTool } from "@/components/interview/InterviewTool";

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-2">
        <SparkIcon width={20} height={20} />
        <h1 className="text-3xl font-semibold text-ink">Interview practice</h1>
      </div>
      <p className="mt-2 text-ink-soft">
        Practice the questions admissions interviewers actually ask, in your own words. Get honest feedback on what worked
        and what to sharpen — plus a realistic follow-up to keep going. No profile needed, but if you have one the first
        question fits your field.
      </p>

      <div className="mt-8">
        <InterviewTool />
      </div>
    </div>
  );
}
