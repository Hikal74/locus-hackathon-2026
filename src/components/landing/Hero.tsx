import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExampleButton } from "@/components/landing/ExampleButton";

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-4 py-4 text-center sm:py-8">
      <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
        Your university path, without the guesswork.
      </h1>
      <p className="max-w-xl text-base text-ink-soft sm:text-lg">
        Take a short test and get a personalized plan: matches, milestones, and a roadmap built around your goals.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/profile">
          <Button size="lg">Take the test</Button>
        </Link>
        <ExampleButton />
      </div>
    </section>
  );
}
