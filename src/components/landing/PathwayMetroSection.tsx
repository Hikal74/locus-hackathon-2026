import { Card } from "@/components/ui/Card";
import { PathwayMetro, PATHWAY_METRO_LINES } from "@/components/landing/PathwayMetro";

export function PathwayMetroSection() {
  return (
    <section className="mt-20">
      <h2 className="text-2xl font-semibold text-ink">Your route, mapped like a metro line</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Six lines — academics, test prep, a passion project, volunteering, leadership, and applications — all
        converging on one destination. Every stop is something you can actually go do.
      </p>
      <Card padding="lg" className="mt-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {PATHWAY_METRO_LINES.map((line) => (
            <div key={line.key} className="flex items-center gap-2">
              <span className="h-2 w-7 shrink-0 rounded-full" style={{ backgroundColor: line.color }} />
              <span className="text-sm font-medium text-ink-soft">{line.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <PathwayMetro />
        </div>
        <p className="mt-4 text-xs italic text-ink-faint">
          Not an official admissions guarantee — plot your own route. Scroll to see the whole line.
        </p>
      </Card>
    </section>
  );
}
