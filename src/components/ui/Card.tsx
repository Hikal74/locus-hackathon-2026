import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/** Flat surface on a hairline border. Set `interactive` for click targets. */
export function Card({ padding = "md", interactive = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-line-soft rounded-[var(--radius-lg)]",
        paddingClasses[padding],
        interactive &&
          "cursor-pointer transition-[background-color,border-color] duration-150 hover:bg-surface-raised hover:border-line active:opacity-90",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
