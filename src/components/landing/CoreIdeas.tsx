import { Badge, VerificationBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { BUDGET_HARD_CEILING_MULTIPLIER, FIT_WEIGHTS } from "@/lib/engine/weights";
import type { FactorKey } from "@/lib/engine/types";

const FACTOR_LABELS: Record<FactorKey, string> = {
  academic: "Academic fit",
  interest: "Interest fit",
  budget: "Budget fit",
  requirements: "Requirement readiness",
  location: "Location fit",
  preferences: "Preference fit",
};

function CardHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{children}</p>
    </div>
  );
}

const PIPELINE = [
  { title: "Your profile", body: "Field, countries, budget, GPA, exams, goals" },
  { title: "Hard filters", body: `Wrong field, country, or tuition beyond ${BUDGET_HARD_CEILING_MULTIPLIER}× your budget — removed, with the reason` },
  { title: "Weighted scoring", body: "Six factors, fixed and published weights" },
  { title: "Ranked matches", body: "Each with reasons and watch-outs" },
];

function Pipeline() {
  return (
    <Card padding="lg" className="flex flex-col gap-6 lg:col-span-2">
      <CardHeading title="No AI picks your universities">
        The ranking is plain, auditable code over structured data. A language model never decides which programs appear or
        how they&apos;re scored — so every result can be traced back to a visible reason.
      </CardHeading>

      <ol className="flex flex-col items-stretch gap-2 md:flex-row md:items-stretch">
        {PIPELINE.map((step, i) => (
          <li key={step.title} className="flex flex-col items-stretch gap-2 md:flex-1 md:flex-row md:items-center">
            <div className="flex-1 rounded-[var(--radius-md)] border border-line bg-surface-raised p-4">
              <p className="text-sm font-semibold text-ink">{step.title}</p>
              <p className="mt-1 text-xs text-ink-soft">{step.body}</p>
            </div>
            {i < PIPELINE.length - 1 && (
              <span aria-hidden="true" className="self-center text-ink-faint">
                <span className="md:hidden">↓</span>
                <span className="hidden md:inline">→</span>
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-[var(--radius-md)] border border-dashed border-ink-faint p-4">
        <p className="text-sm font-semibold text-ink">Where AI does help — after the ranking exists</p>
        <p className="mt-1 text-sm text-ink-soft">
          It rephrases explanations, answers your questions in the chat advisor, and powers the helper tools in the Tools
          menu. When it&apos;s unavailable you get a plain error or the plain-text version — never an invented answer.
        </p>
      </div>
    </Card>
  );
}

function FitScore() {
  const factors = (Object.keys(FIT_WEIGHTS) as FactorKey[]).sort((a, b) => FIT_WEIGHTS[b] - FIT_WEIGHTS[a]);
  const max = Math.max(...factors.map((k) => FIT_WEIGHTS[k]));

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <CardHeading title="How the fit score is built">
        Six factors, each scored 0–100, then combined using the weights below. Change a weight and the ranking changes —
        which is why they&apos;re fixed and published, not tuned per user.
      </CardHeading>
      <ul className="flex flex-col gap-3">
        {factors.map((key) => (
          <li key={key}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink">{FACTOR_LABELS[key]}</span>
              <span className="tabular-nums text-ink-soft">{Math.round(FIT_WEIGHTS[key] * 100)}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-raised">
              <div className="h-full rounded-full bg-ink" style={{ width: `${(FIT_WEIGHTS[key] / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-faint">
        It&apos;s a preference-match score — how well a program fits what you asked for. It is never a chance of being
        admitted.
      </p>
    </Card>
  );
}

function Tiers() {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <CardHeading title="Reach, match, safety — without a false promise">
        We compare your GPA with each program&apos;s published minimum, and ask for a bigger cushion at more selective
        programs. That&apos;s all it looks at.
      </CardHeading>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Badge tone="danger">Reach</Badge>
          <p className="text-sm text-ink-soft">Your GPA is below what this selectivity level calls for. Worth a try, don&apos;t rely on it.</p>
        </div>
        <div className="flex items-start gap-3">
          <Badge tone="accent">Match</Badge>
          <p className="text-sm text-ink-soft">Your GPA meets the published minimum with the cushion this program needs.</p>
        </div>
        <div className="flex items-start gap-3">
          <Badge tone="primary">Safety</Badge>
          <p className="text-sm text-ink-soft">Your GPA is comfortably above it.</p>
        </div>
      </div>
      <p className="text-xs text-ink-faint">
        It ignores essays, exams, and activities, so it&apos;s a guide to where to aim — not a prediction. If your GPA or the
        program&apos;s minimum is missing, we say so instead of guessing.
      </p>
    </Card>
  );
}

function TrustLabels() {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <CardHeading title="Every fact wears a trust label">
        Tuition, deadlines, and requirements go stale. So each one is tagged with how sure we are, and nothing is shown as
        more certain than it is.
      </CardHeading>
      <ul className="flex flex-col gap-3">
        <li className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
          <span className="sm:w-40 sm:shrink-0">
            <VerificationBadge status="verified" />
          </span>
          <p className="text-sm text-ink-soft">Confirmed against a specific official page, with the link and date recorded.</p>
        </li>
        <li className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
          <span className="sm:w-40 sm:shrink-0">
            <VerificationBadge status="needs_verification" />
          </span>
          <p className="text-sm text-ink-soft">
            From a secondary source — likely close, but not confirmed current. Check with the university before you rely on it.
          </p>
        </li>
        <li className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
          <span className="sm:w-40 sm:shrink-0">
            <VerificationBadge status="demo_data" />
          </span>
          <p className="text-sm text-ink-soft">No reliable figure was found, so we show an estimate — labeled as one, never as fact.</p>
        </li>
      </ul>
    </Card>
  );
}

const TRACK_DASHES = ["", "10 6", "2 7", "12 4 2 4"];
const TRACKS = ["Academic prep", "Portfolio & achievements", "Documents & funding", "Applications & essays"];

function Roadmap() {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <CardHeading title="A roadmap, not a checklist">
        Four tracks run in parallel and converge on one goal: your application-ready portfolio. Each stop breaks into small
        steps, and the roadmap always tells you the single next thing to do.
      </CardHeading>
      <svg viewBox="0 0 220 110" className="w-full" role="img" aria-label="Four tracks converging on one goal">
        {TRACK_DASHES.map((dash, i) => {
          const y = 14 + i * 24;
          return (
            <g key={i}>
              <path
                d={`M 8 ${y} L 130 ${y} L 190 55`}
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={dash || undefined}
                className="text-ink"
              />
              {[24, 64, 104].map((x) => (
                <circle key={x} cx={x} cy={y} r={4} className="fill-paper stroke-ink" strokeWidth={2} />
              ))}
            </g>
          );
        })}
        <circle cx={194} cy={55} r={9} className="fill-paper stroke-ink" strokeWidth={3} />
      </svg>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-soft">
        {TRACKS.map((t) => (
          <li key={t}>• {t}</li>
        ))}
      </ul>
    </Card>
  );
}

export function CoreIdeas() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Pipeline />
      <FitScore />
      <Tiers />
      <TrustLabels />
      <Roadmap />
    </div>
  );
}
