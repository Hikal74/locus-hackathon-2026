import { Card } from "@/components/ui/Card";
import { universities, programs } from "@/lib/data/dataset";

/** Counted from the actual dataset at build time, so the numbers can never drift from what the product really covers. */
export function DatasetStats() {
  const stats = [
    { value: programs.length, label: "programs" },
    { value: universities.length, label: "universities" },
    { value: new Set(universities.map((u) => u.country)).size, label: "countries" },
    { value: new Set(programs.map((p) => p.field)).size, label: "fields of study" },
  ];

  return (
    <Card padding="none" className="mt-8 overflow-hidden">
      <dl className="grid grid-cols-2 divide-x divide-y divide-line-soft sm:grid-cols-4 sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5 px-4 py-4 text-center">
            <dd className="order-1 text-2xl font-semibold tabular-nums text-ink">{s.value}</dd>
            <dt className="order-2 text-sm text-ink-soft">{s.label}</dt>
          </div>
        ))}
      </dl>
      <p className="border-t border-line-soft px-4 py-2.5 text-center text-xs text-ink-faint">
        Every fact is tagged verified, needs verification, or demo data — nothing is shown as more certain than it is.
      </p>
    </Card>
  );
}
