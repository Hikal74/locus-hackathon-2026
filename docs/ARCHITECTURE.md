# Architecture

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind v4** — one framework for routing, rendering, and (now) a server-side API route, no separate backend process needed.
- **No state library.** The only cross-page state is the student profile plus two small persisted values (roadmap task completion, saved-program ids). A custom `useSyncExternalStore`-based localStorage hook (`src/lib/store/local-storage.ts`) covers this with zero added dependencies.
- **No database yet.** Local persistence by design (see `docs/DATA_AND_TRUST.md` and the product-decisions table in `PROJECT_MASTER_GUIDE.md`). The data-access boundary (`src/lib/data/dataset.ts` exporting plain `universities`/`programs` arrays) is written so swapping to a real database later means changing one file, not the pages that consume it.
- **Google Gemini API (`@google/genai`), server-only**, for two features: a retrieval-grounded AI advisor and a lighter explanation-rephrasing layer — see `docs/AI_USAGE.md`.
- **Zod**, for request/response schema validation at the AI advisor's server boundary (`src/lib/ai/advisor-schema.ts`) — the one place in the app that accepts a request-shaped payload complex enough to warrant a schema library rather than hand-written type guards.

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
  ├─ POST /api/explain (only when a user expands "Why it fits")
  │     ├─ validates body shape
  │     ├─ rephraseExplanation() → Gemini API (if GOOGLE_AI_API_KEY set)
  │     └─ returns { whyItFits, watchOut, source: "ai" | "template" }
  │           (on ANY failure, returns the original template text unchanged)
  │
  └─ POST /api/advisor (on the Recommendations page, "Get AI Advisor Analysis" or a follow-up question)
        │
        ├─ validates body shape (Zod)
        ├─ retrieveContext() — reuses getRecommendations as a retriever, caps
        │     what's returned so the whole database is never sent
        ├─ generateAdvisorAnalysis() → ONE Gemini call, structured JSON output,
        │     re-validated (Zod) and citation-sanitized against the retrieved set
        └─ returns { analysis, sources } on success, or a typed error — on
              failure the UI shows a real error state, NEVER the deterministic
              engine's output disguised as an AI answer (see docs/AI_USAGE.md)
```

The recommendation/diagnosis/roadmap logic never leaves the browser and never calls the network — it's plain TypeScript over the bundled dataset. `/api/explain` is a small, best-effort copy-polish request that degrades to already-correct template text on any failure. `/api/advisor` is the substantial AI feature — a retrieval-grounded reasoning pipeline where the database still decides which universities are eligible (via the same deterministic engine) but Gemini produces the actual personalized analysis; see `docs/AI_USAGE.md` for the full pipeline and why it deliberately has no template fallback of its own.

## Folder map

```
src/
  lib/
    data/       Core types, the dataset, the judge-mode sample profile, field labels.
    engine/     Recommendation scoring, explanation text, diagnosis, roadmap generation.
                Pure functions — see docs/RECOMMENDATION_ENGINE.md. Unit-tested (src/lib/engine/*.test.ts).
    ai/         client.ts (Gemini client + shared model config), explain.ts +
                use-explain.ts (rephrasing), retrieval.ts (database → grounded
                evidence), advisor-prompt.ts (system instruction + context
                building), advisor.ts (the Gemini call + validation +
                citation sanitization), advisor-schema.ts (Zod request/response
                schemas), use-advisor.ts (client hook). See docs/AI_USAGE.md.
    store/      localStorage-backed state: profile context, saved-programs hook.
    utils/      cn() classname joiner.
  components/
    clay/       The design system: ClayButton, ClayCard, ClayInput, ClayTextarea,
                ClaySelect, ClayChip, ClayProgress, ClayBadge/VerificationBadge.
    layout/     NavBar, RequireProfile (the auth-less "you need a profile" gate).
    landing/    Judge-mode entry point.
    recommendations/  RecommendationCard (fit score, why-it-fits, save/compare toggles).
    advisor/    AdvisorPanel — the AI advisor's UI, embedded on the Recommendations page.
  app/
    page.tsx                Landing
    profile/page.tsx         6-step questionnaire (adds a free-text step — see docs/AI_USAGE.md)
    diagnosis/page.tsx        Strengths/constraints/gaps/readiness
    recommendations/page.tsx  Ranked list, What-If controls, save/compare, AI advisor panel
    compare/page.tsx           Side-by-side table
    roadmap/page.tsx            Next action, readiness, Now/Next/Later tasks
    saved/page.tsx               Bookmarked programs
    api/explain/route.ts          Rephrasing server endpoint
    api/advisor/route.ts           AI advisor server endpoint
```

## Why these choices

- **Deterministic engine decides eligibility, AI reasons over the result — never the reverse.** This is the single architectural fact worth defending to a judge. The AI advisor (`docs/AI_USAGE.md`) reuses the same deterministic hard-filter + scoring pipeline as a *retriever*: it decides which programs are even in scope, and Gemini's reasoning is grounded in that already-filtered, already-scored evidence. Gemini never gets to invent or reorder which universities are eligible — only to explain, synthesize, and personalize on top of a result the deterministic engine already produced. See `docs/RECOMMENDATION_ENGINE.md` and `docs/AI_USAGE.md`.
- **localStorage over a database, for now.** Chosen explicitly (not a default) because there were no Supabase credentials available and a hackathon demo benefits more from zero external dependencies than from persistence surviving a browser wipe. The `dataset.ts` boundary is deliberately the only place that would need to change to swap in a real database.
- **No state library.** Cross-page state here is small and simple enough that React Context + one custom hook is less code and less to explain than Redux/Zustand would be, without giving up anything the app actually needs.
- **App Router + Server Route for AI, not a separate service.** Keeping the AI call server-side is a hard requirement (the API key must never reach the browser — see `docs/SECURITY.md`), and Next's route handlers are the simplest way to get a server boundary without standing up a second deployable.
