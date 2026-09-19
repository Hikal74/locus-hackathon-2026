import { cn } from "@/lib/utils/cn";
import type { VerificationStatus } from "@/lib/data/types";
import { CheckIcon, QuestionIcon, ClockIcon } from "./icons";

interface BadgeProps {
  tone?: "primary" | "accent" | "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
  className?: string;
}

/**
 * Monochrome status encoding: every tone is black/white/gray only, so the
 * distinction has to come from fill weight + border pattern, not hue.
 */
const toneClasses: Record<NonNullable<BadgeProps["tone"]>, string> = {
  primary: "bg-ink text-on-primary border border-ink",
  accent: "bg-paper text-ink border border-ink",
  success: "bg-ink text-on-primary border border-ink",
  warning: "bg-paper text-ink border border-dashed border-ink",
  danger: "bg-paper text-ink border-2 border-ink",
  neutral: "bg-surface-raised text-ink-soft border border-dotted border-ink-faint",
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const verificationConfig: Record<
  VerificationStatus,
  { label: string; tone: BadgeProps["tone"]; icon: React.ReactNode }
> = {
  verified: { label: "Verified", tone: "success", icon: <CheckIcon width={12} height={12} /> },
  needs_verification: {
    label: "Needs verification",
    tone: "warning",
    icon: <QuestionIcon width={12} height={12} />,
  },
  demo_data: { label: "Demo data", tone: "neutral", icon: <ClockIcon width={12} height={12} /> },
};

/** Trust indicator required by docs/DATA_AND_TRUST.md — never render a fact without one. */
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = verificationConfig[status];
  return (
    <Badge tone={config.tone}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
