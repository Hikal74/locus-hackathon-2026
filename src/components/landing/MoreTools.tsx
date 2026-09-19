import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/ui/icons";

const TOOLS = [
  {
    href: "/essay-coach",
    title: "Essay Coach",
    body: "Feedback on your draft, pointing at the exact passages. It never rewrites it for you.",
  },
  {
    href: "/interview",
    title: "Interview practice",
    body: "Answer real admissions questions and get honest feedback plus a follow-up.",
  },
  {
    href: "/deadlines",
    title: "Deadline calendar",
    body: "Every deadline for your matches on one timeline, with a calendar download.",
  },
];

export function MoreTools() {
  return (
    <section aria-label="More tools" className="mt-4 grid gap-4 sm:grid-cols-3">
      {TOOLS.map((tool) => (
        <Link key={tool.href} href={tool.href} className="block">
          <Card padding="sm" interactive className="h-full">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-ink">{tool.title}</h2>
              <ChevronRightIcon width={16} height={16} className="shrink-0 text-ink-faint" />
            </div>
            <p className="mt-1 text-sm text-ink-soft">{tool.body}</p>
          </Card>
        </Link>
      ))}
    </section>
  );
}
