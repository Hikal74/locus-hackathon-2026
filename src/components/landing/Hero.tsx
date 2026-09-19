import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExampleButton } from "@/components/landing/ExampleButton";

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-5 py-6 text-center sm:py-12">
      <p className="rounded-[var(--radius-pill)] border border-line px-4 py-1.5 text-xs font-medium text-ink-soft">
        Personalized university admissions route · Kazakhstan · USA · China
      </p>
      <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
        Your university path, without the guesswork.
      </h1>
      <p className="max-w-2xl text-base text-ink-soft sm:text-lg">
        Pathlight turns your field, countries, budget, and constraints into a ranked shortlist, the specific reasons each
        program fits you, and a roadmap for what to do next — with every fact labeled by how much we trust it.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/profile">
          <Button size="lg">Take the test</Button>
        </Link>
        <ExampleButton />
      </div>
      <a href="#how-it-works" className="text-sm text-ink-faint underline underline-offset-4 hover:text-ink">
        How does it work? ↓
      </a>
    </section>
  );
}
