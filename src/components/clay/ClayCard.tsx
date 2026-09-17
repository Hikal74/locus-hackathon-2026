import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/** Raised clay surface. Set `interactive` for cards that act as click targets. */
export function ClayCard({
  padding = "md",
  interactive = false,
  className,
  children,
  ...props
}: ClayCardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-clay-raised)]",
        paddingClasses[padding],
        interactive &&
          "cursor-pointer transition-shadow duration-150 hover:shadow-[var(--shadow-clay-raised-hover)] active:shadow-[var(--shadow-clay-pressed)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
