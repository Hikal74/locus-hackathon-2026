# Architecture

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind v4** — one framework for routing, rendering, and (now) a server-side API route, no separate backend process needed.
- **No state library.** The only cross-page state is the student profile plus two small persisted values (roadmap task completion, saved-program ids). A custom `useSyncExternalStore`-based localStorage hook (`src/lib/store/local-storage.ts`) covers this with zero added dependencies.
- **No database yet.** Local persistence by design (see `docs/DATA_AND_TRUST.md` and the product-decisions table in `PROJECT_MASTER_GUIDE.md`). The data-access boundary (`src/lib/data/dataset.ts` exporting plain `universities`/`programs` arrays) is written so swapping to a real database later means changing one file, not the pages that consume it.
- **Claude API (`@anthropic-ai/sdk`), server-only**, for the AI explanation layer — see `docs/AI_USAGE.md`.

## Request/data flow

```
Browser
  │
  ├─ StudentProfile ──► localStorage (via ProfileProvider / useSyncExternalStore)
  │
  ├─ Pure functions, run entirely client-side, zero network calls:
  │     getRecommendations(profile, universities, programs)  → ranked matches
  │     buildDiagnosis(profile)                               → strengths/gaps/readiness
  │     buildRoadmap(profile, recommendations)                → prioritized tasks
  │
  └─ POST /api/explain (only when a user expands "Why it fits")
        │
        ├─ validates body shape
        ├─ rephraseExplanation() → Claude API (if ANTHROPIC_API_KEY set)
        └─ returns { whyItFits, watchOut, source: "ai" | "template" }
              (on ANY failure, returns the original template text unchanged)
```

The recommendation/diagnosis/roadmap logic never leaves the browser and never calls the network — it's plain TypeScript over the bundled dataset. The only network call in the whole product is the optional, best-effort AI copy-polish request, and it degrades to already-correct template text on any failure.

## Folder map

```
src/
  lib/
    data/       Core types, the dataset, the judge-mode sample profile, field labels.
    engine/     Recommendation scoring, explanation text, diagnosis, roadmap generation.
                Pure functions — see docs/RECOMMENDATION_ENGINE.md. Unit-tested (src/lib/engine/*.test.ts).
    ai/         Claude API client, the rephrase-with-fallback function, a client hook.
                See docs/AI_USAGE.md.
    store/      localStorage-backed state: profile context, saved-programs hook.
    utils/      cn() classname joiner.
  components/
    clay/       The design system: ClayButton, ClayCard, ClayInput, ClaySelect, ClayChip,
                ClayProgress, ClayBadge/VerificationBadge.
    layout/     NavBar, RequireProfile (the auth-less "you need a profile" gate).
    landing/    Judge-mode entry point.
    recommendations/  RecommendationCard (fit score, why-it-fits, save/compare toggles).
  app/
    page.tsx                Landing
    profile/page.tsx         5-step questionnaire
    diagnosis/page.tsx        Strengths/constraints/gaps/readiness
    recommendations/page.tsx  Ranked list, What-If controls, save/compare
    compare/page.tsx           Side-by-side table
    roadmap/page.tsx            Next action, readiness, Now/Next/Later tasks
    saved/page.tsx               Bookmarked programs
    api/explain/route.ts          The one server endpoint
```

## Why these choices

- **Deterministic engine, AI on top, never AI as the source of matches.** This is the single architectural fact worth defending to a judge — see `docs/RECOMMENDATION_ENGINE.md` and `docs/AI_USAGE.md`.
- **localStorage over a database, for now.** Chosen explicitly (not a default) because there were no Supabase credentials available and a hackathon demo benefits more from zero external dependencies than from persistence surviving a browser wipe. The `dataset.ts` boundary is deliberately the only place that would need to change to swap in a real database.
- **No state library.** Cross-page state here is small and simple enough that React Context + one custom hook is less code and less to explain than Redux/Zustand would be, without giving up anything the app actually needs.
- **App Router + Server Route for AI, not a separate service.** Keeping the AI call server-side is a hard requirement (the API key must never reach the browser — see `docs/SECURITY.md`), and Next's route handlers are the simplest way to get a server boundary without standing up a second deployable.
