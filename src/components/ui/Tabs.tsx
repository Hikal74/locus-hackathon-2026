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
    <div role="tablist" className={cn("flex gap-1 border-b-2 border-ink", className)}>
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
              "px-4 py-2.5 text-sm font-medium -mb-[2px] border-b-2 transition-colors",
              active ? "border-ink text-ink" : "border-transparent text-ink-faint hover:text-ink-soft"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
