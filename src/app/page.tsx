import Link from "next/link";
import { ClayButton } from "@/components/clay/ClayButton";
import { ClayCard } from "@/components/clay/ClayCard";
import { ExampleButton } from "@/components/landing/ExampleButton";
import { programs } from "@/lib/data/dataset";

const fieldCount = new Set(programs.map((p) => p.field)).size;

const PILLARS = [
  {
    title: "Where",
    body: "Which universities and programs actually fit your field, budget, and country choices — not a directory of everything.",
  },
  {
    title: "Why",
    body: "Every match comes with the specific reasons it appeared for you, plus what still needs attention.",
  },
  {
    title: "What next",
    body: "One clear next step at a time, not a list of fifty tasks you have to prioritize yourself.",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Your university path, without the guesswork.
          </h1>
          <p className="max-w-xl text-lg text-ink-soft">
            Tell us what you want to study, where you want to go, and what matters to you. We&apos;ll turn it into a
            personalized application plan — with the reasoning shown, not hidden.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/profile">
              <ClayButton size="lg">Build my path</ClayButton>
            </Link>
            <ExampleButton />
          </div>
        </div>
        <ClayCard padding="lg" className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink-faint">This build&apos;s dataset</p>
          <p className="text-ink-soft">
            {programs.length} real programs across {fieldCount} fields of study in the{" "}
            <strong className="text-ink">USA</strong>, <strong className="text-ink">Kazakhstan</strong>, and{" "}
            <strong className="text-ink">China</strong> — each fact labeled verified, needs-verification, or demo
            data, never presented as more certain than it is.
          </p>
        </ClayCard>
      </section>

      <section className="mt-20 grid gap-6 sm:grid-cols-3">
        {PILLARS.map((pillar) => (
          <ClayCard key={pillar.title} padding="md">
            <h2 className="text-lg font-semibold text-ink">{pillar.title}</h2>
            <p className="mt-2 text-sm text-ink-soft">{pillar.body}</p>
          </ClayCard>
        ))}
      </section>
    </div>
  );
}
