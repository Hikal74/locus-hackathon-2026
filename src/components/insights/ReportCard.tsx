import { VerificationBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import type { ReportCardEntry } from "@/lib/engine/reportcard";

function GradeBox({ grade }: { grade: ReportCardEntry["grade"] }) {
  return (
    <span
      aria-label={grade ? `Grade ${grade}` : "Not graded"}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border-2 text-xl font-bold",
        grade === "A" || grade === "B" ? "border-ink bg-ink text-on-primary" : "border-ink bg-paper text-ink",
        grade === null && "border-dotted border-ink-faint text-ink-faint",
        grade === "D" || grade === "F" ? "border-dashed" : null
      )}
    >
      {grade ?? "—"}
    </span>
  );
}

export function ReportCard({ entries }: { entries: ReportCardEntry[] }) {
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.key} className="flex items-start gap-3">
            <GradeBox grade={entry.grade} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{entry.label}</p>
              <p className="text-xs text-ink-soft">{entry.basis}</p>
              {entry.grade !== null && (
                <div className="mt-1">
                  <VerificationBadge status={entry.status} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-faint">
        Rule-of-thumb grades computed from Pathlight&apos;s own data and your profile — not student reviews.
      </p>
    </div>
  );
}
