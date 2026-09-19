# Architecture

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind v4** — one framework for routing, rendering, and (now) a server-side API route, no separate backend process needed.
- **No state library.** The only cross-page state is the student profile plus two small persisted values (roadmap task completion, saved-program ids). A custom `useSyncExternalStore`-based localStorage hook (`src/lib/store/local-storage.ts`) covers this with zero added dependencies.
- **No database yet.** Local persistence by design (see `docs/DATA_AND_TRUST.md` and the product-decisions table in `PROJECT_MASTER_GUIDE.md`). The data-access boundary (`src/lib/data/dataset.ts` exporting plain `universities`/`programs` arrays) is written so swapping to a real database later means changing one file, not the pages that consume it.
- **Google Gemini API (`@google/genai`), server-only**, for three features: a retrieval-grounded AI advisor, a global freeform chat advisor reachable from every page, and a lighter explanation-rephrasing layer — see `docs/AI_USAGE.md`.
- **Zod**, for request/response schema validation at the AI advisor's server boundary (`src/lib/ai/advisor-schema.ts`) — the one place in the app that accepts a request-shaped payload complex enough to warrant a schema library rather than hand-written type guards.

## Request/data flow

```
Browser
  │
  ├─ StudentProfile ──► localStorage (via ProfileProvider / useSyncExternalStore)
  │
  ├─ Pure functions, run entirely client-side, zero network calls:
  │     getRecommendations(profile, universities, programs, weights?)  → ranked matches
  │     buildDiagnosis(profile)                               → strengths/gaps
  │     buildRoadmap(profile, recommendations) + buildPortfolioTasks(profile)  → prioritized tasks
  │     buildMetroMap(tasks)                                  → 4-line metro-map diagram
  │
  ├─ POST /api/explain (only when a user expands "Why it fits")
  │     ├─ validates body shape
  │     ├─ rephraseExplanation() → Gemini API (if GOOGLE_AI_API_KEY set)
  │     └─ returns { whyItFits, watchOut, source: "ai" | "template" }
  │           (on ANY failure, returns the original template text unchanged)
  │
  ├─ POST /api/advisor (the advisor drawer's "Full analysis" tab)
  │     ├─ validates body shape (Zod)
  │     ├─ retrieveContext() — reuses getRecommendations as a retriever, caps
  │     │     what's returned so the whole database is never sent
  │     ├─ generateAdvisorAnalysis() → ONE Gemini call, structured JSON output,
  │     │     re-validated (Zod) and citation-sanitized against the retrieved set
  │     └─ returns { analysis, sources } on success, or a typed error — on
  │           failure the UI shows a real error state, NEVER the deterministic
  │           engine's output disguised as an AI answer (see docs/AI_USAGE.md)
  │
  └─ POST /api/chat (the advisor drawer's "Chat" tab — global, every route)
        ├─ validates body shape (Zod)
        ├─ retrieveForQuery() — profile-based retrieval widened with a keyword
        │     match against the question text, so off-profile questions ("what's
        │     the IELTS requirement at KBTU?") still get grounded
        ├─ generateChatReply() → ONE Gemini call per turn, real multi-turn
        │     `contents` array, plain-text reply
        └─ returns { reply, sources } on success, or a typed error
```

The recommendation/diagnosis/roadmap logic never leaves the browser and never calls the network — it's plain TypeScript over the bundled dataset. `/api/explain` is a small, best-effort copy-polish request that degrades to already-correct template text on any failure. `/api/advisor` and `/api/chat` are the substantial AI features — both reasoning over evidence the deterministic engine already retrieved, never deciding eligibility themselves; see `docs/AI_USAGE.md` for the full pipeline and why the advisor deliberately has no template fallback of its own.

## Folder map

```
src/
  lib/
    data/       Core types, the dataset, the judge-mode sample profile, field labels.
    engine/     Recommendation scoring, explanation text, diagnosis, roadmap generation
                (roadmap.ts, incl. buildPortfolioTasks — fixed, field-tailored portfolio
                activities), metro.ts (groups roadmap tasks into the 4 metro-map lines).
                Pure functions — see docs/RECOMMENDATION_ENGINE.md. Unit-tested
                (src/lib/engine/*.test.ts).
    ai/         client.ts (Gemini client + shared model config), errors.ts (shared
                failure classification), explain.ts + use-explain.ts (rephrasing),
                retrieval.ts (database → grounded evidence, both profile-based and
                free-text-query-widened), advisor-prompt.ts + advisor.ts +
                advisor-schema.ts + use-advisor.ts (the structured advisor), chat.ts +
                chat-schema.ts + use-chat.ts (the global freeform chat advisor). See
                docs/AI_USAGE.md.
    store/      localStorage-backed state: profile context, saved-programs hook,
                match-weights hook (always the balanced FIT_WEIGHTS default now — kept
                as the one place downstream pages read weights from).
    utils/      cn() classname joiner.
  components/
    ui/         The monochrome design system: Button, Card, Input, Textarea, Select,
                Badge/VerificationBadge, Chip, Progress, Tabs, Drawer, icons.tsx
                (hand-rolled stroke-SVG icon set — no icon library).
    layout/     NavBar, RequireProfile (the auth-less "you need a profile" gate).
    landing/    Judge-mode entry point, hero, pillars, the homepage's decorative metro map.
    profile/    12-step onboarding orchestrator's per-step field components
                (src/components/profile/steps/*.tsx), tagged by effort level — see
                src/lib/data/onboarding-steps.ts.
    recommendations/  RecommendationCard (fit score, why-it-fits, save/compare toggles).
    roadmap/    MetroMap — hand-rolled inline SVG diagram (no charting library) rendering
                the roadmap as 4 parallel lines converging on a "Dream Portfolio" terminus,
                lines distinguished by stroke pattern (not color), click-to-expand stations.
    advisor/    AdvisorLauncher + AdvisorDrawer (global, mounted at the root layout,
                reachable from every route) with two tabs: Chat (freeform, /api/chat)
                and Full analysis (the structured advisor, AdvisorPanel.tsx, unchanged
                logic, relocated from the Recommendations page into the drawer).
  app/
    page.tsx                Landing
    profile/page.tsx         12-step questionnaire orchestrator, ordered into 4 effort levels (see
                             src/lib/data/onboarding-steps.ts); each step's fields live in
                             src/components/profile/steps/*.tsx
    diagnosis/page.tsx        Strengths/constraints/gaps
    recommendations/page.tsx  Ranked list, What-If controls, save/compare, opens the
                               drawer's Full analysis tab (no longer embeds it inline)
    compare/page.tsx           Side-by-side table
    roadmap/page.tsx            Next action + the MetroMap: 4 parallel lines (Academic
                                 Prep, Portfolio & Achievements, Documents & Funding,
                                 Applications & Essays) converging on Dream Portfolio
    saved/page.tsx               Bookmarked programs
    api/explain/route.ts          Rephrasing server endpoint
    api/advisor/route.ts           Structured AI advisor server endpoint
    api/chat/route.ts               Global chat advisor server endpoint
```

**Removed:** a `/match` method-picker page (Duels / Rank / Fit Map / AI Interview) and each method's route/engine code once let a student choose how their fit-score weights were personalized. The whole subsystem — `personalize.ts`, `duels.ts`, `priorities.ts`/`priorities-schema.ts`, `POST /api/priorities`, the `Slider` UI primitive — was removed to simplify the flow; every profile now uses the balanced `FIT_WEIGHTS` default. See `docs/BUILDER_JOURNAL.md`.

## Why these choices

- **Deterministic engine decides eligibility, AI reasons over the result — never the reverse.** This is the single architectural fact worth defending to a judge. The AI advisor (`docs/AI_USAGE.md`) reuses the same deterministic hard-filter + scoring pipeline as a *retriever*: it decides which programs are even in scope, and Gemini's reasoning is grounded in that already-filtered, already-scored evidence. Gemini never gets to invent or reorder which universities are eligible — only to explain, synthesize, and personalize on top of a result the deterministic engine already produced. See `docs/RECOMMENDATION_ENGINE.md` and `docs/AI_USAGE.md`.
- **localStorage over a database, for now.** Chosen explicitly (not a default) because there were no Supabase credentials available and a hackathon demo benefits more from zero external dependencies than from persistence surviving a browser wipe. The `dataset.ts` boundary is deliberately the only place that would need to change to swap in a real database.
- **No state library.** Cross-page state here is small and simple enough that React Context + one custom hook is less code and less to explain than Redux/Zustand would be, without giving up anything the app actually needs.
- **App Router + Server Route for AI, not a separate service.** Keeping the AI call server-side is a hard requirement (the API key must never reach the browser — see `docs/SECURITY.md`), and Next's route handlers are the simplest way to get a server boundary without standing up a second deployable.
