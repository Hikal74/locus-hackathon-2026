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

const compactLabel: Record<VerificationStatus, string> = {
  verified: "Verified",
  needs_verification: "To verify",
  demo_data: "Demo",
};

/**
 * Trust indicator required by docs/DATA_AND_TRUST.md — never render a fact without one.
 * `compact` shortens the label for dense stat grids; the full wording stays in the tooltip.
 */
export function VerificationBadge({ status, compact = false }: { status: VerificationStatus; compact?: boolean }) {
  const config = verificationConfig[status];
  if (compact) {
    return (
      <span title={config.label} className="inline-flex">
        <Badge tone={config.tone} className="gap-1 px-2 py-0.5 text-[11px]">
          {config.icon}
          {compactLabel[status]}
        </Badge>
      </span>
    );
  }
  return (
    <Badge tone={config.tone}>
      {config.icon}
      {config.label}
    </Badge>
  );
}
