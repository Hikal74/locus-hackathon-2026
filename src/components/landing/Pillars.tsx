import { Card } from "@/components/ui/Card";

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

export function Pillars() {
  return (
    <section className="mt-4 grid gap-4 sm:grid-cols-3">
      {PILLARS.map((pillar) => (
        <Card key={pillar.title} padding="sm">
          <h2 className="text-lg font-semibold text-ink">{pillar.title}</h2>
          <p className="mt-2 text-sm text-ink-soft">{pillar.body}</p>
        </Card>
      ))}
    </section>
  );
}
