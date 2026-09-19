import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ExampleButton } from "@/components/landing/ExampleButton";

export function FinalCta() {
  return (
    <Card padding="lg" className="mt-24 flex flex-col items-center gap-5 py-14 text-center">
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Ready to see your own route?</h2>
      <p className="max-w-xl text-ink-soft">
        Answer a few questions, or explore with a sample profile first. Your profile is stored only in your browser; AI
        features send just the text they need to Google&apos;s Gemini API when you use them.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/profile">
          <Button size="lg">Take the test</Button>
        </Link>
        <ExampleButton />
      </div>
    </Card>
  );
}
