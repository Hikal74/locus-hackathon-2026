import { cn } from "@/lib/utils/cn";
import type { VerificationStatus } from "@/lib/data/types";

interface ClayBadgeProps {
  tone?: "primary" | "accent" | "success" | "warning" | "danger" | "neutral";
  children: React.ReactNode;
  className?: string;
}

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-ink/5 text-ink-soft",
};

export function ClayBadge({ tone = "neutral", children, className }: ClayBadgeProps) {
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

const verificationConfig: Record<VerificationStatus, { label: string; tone: ClayBadgeProps["tone"] }> = {
  verified: { label: "Verified", tone: "success" },
  needs_verification: { label: "Needs verification", tone: "warning" },
  demo_data: { label: "Demo data", tone: "neutral" },
};

/** Trust indicator required by docs/DATA_AND_TRUST.md — never render a fact without one. */
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = verificationConfig[status];
  return <ClayBadge tone={config.tone}>{config.label}</ClayBadge>;
}
