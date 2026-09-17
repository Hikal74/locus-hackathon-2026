# Pathlight

Your university path, without the guesswork.

Pathlight turns a student's field of study, target countries, budget, and constraints into a personalized, explained university application shortlist — built for LOCUS Hackathon 2026, Case 02 ("Personalized University Admissions Route").

## The problem

Students choosing between universities across multiple countries face wildly different costs, languages, exam systems, and deadlines, with no single tool that turns their situation into a concrete, prioritized plan. Generic search sites list everything with no personalization; a chatbot can invent facts it doesn't actually know.

## The solution

A structured, five-step questionnaire produces a profile. A deterministic scoring algorithm — not an LLM — filters and ranks real university programs against that profile, explains why each one fits, flags what to watch out for, and generates a single prioritized next action. Every factual claim (tuition, deadlines, requirements) is labeled with how confident the data actually is.

## Key features

- **AI Advisor** — a retrieval-grounded Gemini advisor that reasons across your full profile (including free-text achievements/goals) and a relevant slice of the university database to produce a personalized analysis, not a template.
- **Guided profile** — a progressive 6-step form instead of one long questionnaire, including a free-text step for anything the structured fields don't capture.
- **Diagnosis** — strengths, constraints, and gaps read directly from the profile, plus a readiness view that is never framed as an admission probability.
- **Ranked recommendations** — a transparent, six-factor scoring algorithm with a visible score breakdown on every result.
- **What-If mode** — change budget or country preference and watch the shortlist and reasoning update live.
- **Comparison view** — side-by-side tradeoffs for selected programs, deliberately not a "best pick."
- **Roadmap** — a single pinned "next action," a readiness view, and a prioritized Now/Next/Later task list.
- **Saved programs** — bookmark and revisit options as the shortlist changes.
- **Data trust system** — every fact is labeled verified, needs-verification, or demo data.

## User journey

Landing → Profile → Diagnosis → Recommendations → Comparison → Roadmap → Next Action → Progress.

## Recommendation architecture

No LLM decides which universities appear. A plain TypeScript pipeline (`src/lib/engine/`) hard-filters impossible options (wrong field, wrong country, tuition far beyond budget), then scores everything that survives across six weighted factors (academic fit, interest fit, budget fit, requirement readiness, location fit, preference fit), then ranks by the weighted result. Explanation text is generated only from those already-computed numbers. Full specification: [`docs/RECOMMENDATION_ENGINE.md`](docs/RECOMMENDATION_ENGINE.md).

## AI usage

Two Gemini-powered features, both server-side, no other AI provider anywhere in the codebase:

- **AI Advisor** (`/api/advisor`, surfaced on the Recommendations page) — a retrieval-grounded advisory pipeline. The deterministic engine still decides which universities are eligible (same hard filters, same scoring); Gemini reasons across the student's full profile — including free-text achievements, projects, and goals the scoring engine can't parse — plus that already-filtered database evidence, to produce a personalized, structured analysis. On failure, it shows a real error with a retry option — never the deterministic engine's output disguised as an AI answer.
- **Explanation rephrasing** (`/api/explain`) — rephrases already-computed "why it fits" text into warmer prose, constrained by a prompt that forbids adding new facts, with the deterministic template text as an automatic, verified fallback when no API key is configured or the call fails.

Neither feature ever silently retries against a different model or provider — a failed Gemini call returns a handled, typed error. AI never selects which universities are eligible to appear at all; that stays deterministic. Full detail: [`docs/AI_USAGE.md`](docs/AI_USAGE.md).

## Data sources and verification

Every tuition, deadline, requirement, and scholarship figure is labeled `verified` (confirmed against a specific official page), `needs_verification` (a plausible secondary source), or `demo_data` (estimated, no reliable source found) — rendered as a visible badge in the UI. Full per-university breakdown: [`docs/DATA_AND_TRUST.md`](docs/DATA_AND_TRUST.md).

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Vitest. Google Gemini API (`@google/genai`) for the AI advisor and explanation layers; Zod for request/response validation. No database — local persistence via `localStorage`, accessed through a `useSyncExternalStore`-based hook.

## Architecture

Full architecture, stack rationale, and folder map: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Setup

```bash
npm install
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in real values. Both are optional — the app runs fully functional without them:

```
GOOGLE_AI_API_KEY=      # enables live AI rephrasing; falls back to templates if unset
GEMINI_MODEL=           # optional override, defaults to gemini-3.6-flash
```

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On Windows, double-clicking `START_HERE.bat` builds and runs a production instance and opens it in the browser automatically.

## Testing

```bash
npm test       # Vitest — recommendation engine, diagnosis, and roadmap logic
npm run lint   # ESLint
```

## Deployment

Deployed via Vercel. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data-flow model; no database or external service is required for a working deployment.

## Limitations

- Dataset covers Computer Science, Business, Engineering, Natural Sciences, and Humanities across 9 universities in the USA, Kazakhstan, and China. No Medicine or Arts program data was found for these institutions.
- No accounts or cross-device sync — state is per-browser (`localStorage`).
- Both Gemini features (AI Advisor, explanation rephrasing) require a provisioned Google AI Studio (Gemini) API key; without one, the AI Advisor shows a clear "not configured" error and rephrasing falls back to deterministic template text. Neither's live model call has been exercised in this build — request validation, retrieval, and error handling have been (see `docs/AI_USAGE.md`).
- AI Advisor follow-up conversation history is in-memory only and resets on page reload.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture and stack rationale
- [`docs/RECOMMENDATION_ENGINE.md`](docs/RECOMMENDATION_ENGINE.md) — scoring algorithm specification
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — AI integration and fallback behavior
- [`docs/DATA_AND_TRUST.md`](docs/DATA_AND_TRUST.md) — data verification model
- [`docs/SECURITY.md`](docs/SECURITY.md) — secrets handling and data boundaries
- [`docs/BUILDER_JOURNAL.md`](docs/BUILDER_JOURNAL.md) — engineering decision log

## Hackathon context

Built for LOCUS Hackathon 2026, Case 02 ("Personalized University Admissions Route"). Pathlight is an independent product name, not affiliated with or branded as the LOCUS platform.
