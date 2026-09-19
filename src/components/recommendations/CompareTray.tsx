"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

/**
 * Floating action pill rather than a full-width band: it never covers page content edge to edge, and the
 * right padding on phones keeps it clear of the chat button that lives in the bottom-right corner.
 */
export function CompareTray({ selectedIds }: { selectedIds: string[] }) {
  const router = useRouter();
  const count = selectedIds.length;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-20 flex justify-center px-4 pb-[env(safe-area-inset-bottom,0px)] pr-24 sm:pr-4">
      <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-surface/95 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur sm:pl-5">
        <span className="hidden text-sm text-ink-soft sm:inline">
          {count === 0 ? "Pick 2–3 to compare" : `${count} selected`}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={count < 2}
          onClick={() => router.push(`/compare?ids=${selectedIds.join(",")}`)}
        >
          Compare ({count})
        </Button>
        <Button size="sm" onClick={() => router.push("/roadmap")}>
          <span className="sm:hidden">Roadmap</span>
          <span className="hidden sm:inline">Build my roadmap</span>
        </Button>
      </div>
    </div>
  );
}
