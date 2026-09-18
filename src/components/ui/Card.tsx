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

/** Bordered paper surface on a hard offset shadow. Set `interactive` for click targets. */
export function Card({ padding = "md", interactive = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-paper border-2 border-ink rounded-[var(--radius-lg)] shadow-[var(--shadow-raised)]",
        paddingClasses[padding],
        interactive &&
          "cursor-pointer transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-raised-hover)] hover:-translate-x-px hover:-translate-y-px active:shadow-[var(--shadow-pressed)] active:translate-x-[3px] active:translate-y-[3px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
