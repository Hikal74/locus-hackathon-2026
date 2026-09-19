import { Hero } from "@/components/landing/Hero";
import { Pillars } from "@/components/landing/Pillars";
import { Section } from "@/components/landing/Section";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CoreIdeas } from "@/components/landing/CoreIdeas";
import { DatasetStats } from "@/components/landing/DatasetStats";
import { FinalCta } from "@/components/landing/FinalCta";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Hero />

      <Section
        eyebrow="The idea"
        title="Three questions, answered one at a time"
        description="Most tools hand you a directory of everything. Pathlight answers the three things a student actually needs to know."
      >
        <Pillars />
      </Section>

      <Section
        eyebrow="See it in action"
        title="This is what you get"
        description="A ranked shortlist where every match explains itself — including what to watch out for."
      >
        <ProductPreview />
      </Section>

      <Section
        id="how-it-works"
        eyebrow="How it works"
        title="From your answers to a plan, in four steps"
        description="No black box: each step is something you can see and check."
      >
        <HowItWorks />
      </Section>

      <Section
        eyebrow="Core ideas"
        title="The ideas behind the product"
        description="What makes the results trustworthy — and what we deliberately don't do."
      >
        <CoreIdeas />
      </Section>

      <Section
        eyebrow="Coverage"
        title="What's in the data — and what isn't"
        description="A focused set we can stand behind, rather than a catalog we can't."
      >
        <DatasetStats />
        <p className="mt-4 max-w-2xl text-sm text-ink-soft">
          Medicine isn&apos;t covered yet: we couldn&apos;t find credible data for these universities, and we&apos;d rather
          show a gap than invent one.
        </p>
      </Section>

      <FinalCta />
    </div>
  );
}
