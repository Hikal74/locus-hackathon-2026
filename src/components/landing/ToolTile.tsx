import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/ui/icons";

interface ToolTileProps {
  title: string;
  description: string;
  href: string;
  children: React.ReactNode;
}

/** Square window on md+ (content scrolls inside it); grows to fit on phones. */
export function ToolTile({ title, description, href, children }: ToolTileProps) {
  return (
    <Card padding="md" className="flex flex-col overflow-hidden md:aspect-square">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        </div>
        <Link
          href={href}
          aria-label={`Open ${title} as a full page`}
          className="shrink-0 rounded-full border border-line-soft p-1.5 text-ink-faint transition-colors hover:border-ink hover:text-ink"
        >
          <ChevronRightIcon width={16} height={16} />
        </Link>
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>
    </Card>
  );
}
