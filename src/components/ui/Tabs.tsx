import { cn } from "@/lib/utils/cn";

interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Small controlled tab strip — no headless-UI dependency. */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn("inline-flex gap-1 rounded-[var(--radius-pill)] bg-surface p-1", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium transition-colors",
              active ? "bg-ink text-on-primary" : "text-ink-faint hover:text-ink-soft"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
