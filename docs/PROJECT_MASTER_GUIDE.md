# Pathlight — Project Master Guide

The current-state technical overview of Pathlight: what it is, how it's architected, and what exists in the codebase. Kept in sync with the code — if this document and the code disagree, the code is correct.

## 1. The idea

Pathlight turns a student's field, target countries, budget, and constraints into a personalized university application route — which programs fit, why each one fits *that student specifically*, and what to do next. It is built for LOCUS Hackathon 2026, Case 02 ("Personalized University Admissions Route"), targeting a secondary-school student choosing between countries with real constraints: money, language, exams, and deadlines.

**Product name:** Pathlight — an independent name, not affiliated with or branded as the LOCUS platform.

**The three questions the product answers:**
- **Where** — which programs actually fit this student, not a directory of everything.
- **Why** — the specific, traceable reasons a program appeared.
- **What next** — one clear action, not a long list of tasks.

## 2. Target user

A secondary-school student who knows roughly what they want to study but is overwhelmed comparing options across countries with different costs, languages, and exam systems. The bundled demo profile: 17, 12th grade, Computer Science, considering Kazakhstan/USA/China, $18,000/year budget, IELTS 6.5 already completed, SAT not yet taken.

## 3. Key architectural decisions

| Decision | Choice | Rationale |
|---|---|---|
| Data backend | Local persistence (`localStorage`) rather than a database | Removes an external dependency for demo reliability; the data-access layer (`src/lib/data/dataset.ts`) is isolated so a real database can be substituted without touching the pages that consume it. |
| AI integration | Google Gemini API (single provider, no secondary AI fallback), used four ways: a retrieval-grounded structured advisor, a global freeform chat advisor reachable from every page, a conversation-to-priority-order extraction for the Interview match method, and a smaller copy-polish layer with a deterministic template fallback | No LLM decides which universities are *eligible*, ever — that stays deterministic (see §7). Gemini reasons over already-filtered evidence, or extracts a stated preference, instead of the product either showing template sentences or letting a model invent eligibility. See `docs/AI_USAGE.md`. |
| Matching personalization | Four selectable methods (Duels, Rank, Fit Map, Interview) that each produce a personalized weight vector over the same six fit factors, instead of one fixed global weight table | A student who explicitly cares most about cost now gets a shortlist that reflects that, not the same fixed 0.20 budget weight as everyone else — while keeping the underlying scoring deterministic and auditable. See `docs/RECOMMENDATION_ENGINE.md` §2.5. |
| Visual design | Strict black/white/grayscale ("true monochrome") — status and hierarchy carried by weight, border pattern, and icon, never hue | Reads as a considered, editorial product rather than a generic AI-gradient demo; also the most defensible, judge-legible way to guarantee accessibility-by-construction (no color-only meaning anywhere). |
| Dataset scope | 26 real programs across 5 fields (Computer Science, Business, Engineering, Natural Sciences, Humanities) at 9 universities in the USA, Kazakhstan, and China | Broad enough to demonstrate genuine cross-field, cross-country personalization without the scope of a full catalog. Medicine and Arts have no credible data for these institutions and are reported as a gap rather than filled with placeholders — see `docs/DATA_AND_TRUST.md`. |

## 4. Architecture overview

```
Next.js 16 (App Router) + TypeScript + Tailwind v4
                    |
        React Context (ProfileProvider)
                    |
        localStorage (via useSyncExternalStore)
                    |
   ┌────────────────┼──────────────────┬───────────────────┐
   |                |                  |                   |
Structured data   Deterministic    Personalized        UI (true-
(dataset.ts)       engine          weight vector       monochrome
                 (hard filters →   (4 /match methods,   design system,
                  weighted scoring  see §7.2) — read     src/components/ui)
                  → explanation)    by every page that
                                    calls the engine
```

**No LLM sits between the student and a recommendation.** The entire matching pipeline — filtering, scoring, ranking, "why it fits" text — is plain TypeScript over structured data, whether the weights are the default table or one of the four personalized vectors from §7.2. AI sits on top only as a reasoning/copy layer (see §7.3 and `docs/AI_USAGE.md`), never as the source of which universities appear or how they're weighted.

### Stack rationale
- **Next.js App Router** — one framework for routing, rendering, and the five server endpoints the app needs (`/api/explain`, `/api/advisor`, `/api/chat`, `/api/priorities`, `/api/debureaucratize`).
- **Tailwind v4 + CSS custom properties** — the true-monochrome design system's shadows, colors, and radii are defined once as CSS variables in `globals.css`, keeping the entire visual language in one file. No new dependencies were added for the rebuild (no icon library, no chart library, no drag-and-drop library) — icons, the Fit Map's scatter chart, and drag-reorder are all hand-rolled, consistent with the "no state library" stance below.
- **No state library** — cross-page state is small (a profile plus two persisted lists), covered by React Context and one custom `localStorage` hook.
- **No database (yet)** — see §3. The data-access boundary is the one seam that would need to change to add one.

Full detail: `docs/ARCHITECTURE.md`.

## 5. Documentation index

- **Architecture, stack rationale, folder map**: `docs/ARCHITECTURE.md`
- **Recommendation engine specification, weight table, worked example**: `docs/RECOMMENDATION_ENGINE.md`
- **AI integration: what it does, the prompt, failure modes, current status**: `docs/AI_USAGE.md`
- **Secrets handling, input validation, data boundaries, known gaps**: `docs/SECURITY.md`
- **Data verification model, per-university breakdown**: `docs/DATA_AND_TRUST.md`
- **Engineering decision log**: `docs/BUILDER_JOURNAL.md`

## 6. The dataset

Every fact carries a verification status (`verified` / `needs_verification` / `demo_data`) rendered as a colored trust badge in the UI, so nothing is presented as more certain than it is. Full per-university breakdown: `docs/DATA_AND_TRUST.md`.

## 7. The recommendation engine

Hard filters (field, country, budget ceiling) remove programs that can't work at all; six weighted factors (academic fit, interest fit, budget fit, requirement readiness, location fit, preference fit — default weights documented in `src/lib/engine/weights.ts`, summing to 1.0) score everything that survives; explanation text is generated strictly from those computed numbers. **The fit score is a preference-match score, never an admission probability** — enforced in UI copy and covered by tests. Full specification and worked example: `docs/RECOMMENDATION_ENGINE.md`.

This same pipeline doubles as both AI features' retriever (`src/lib/ai/retrieval.ts`) — the deterministic engine decides which programs are eligible and produces the fit score/factor evidence; Gemini reasons over that evidence rather than deciding eligibility itself. See §7.3 and `docs/AI_USAGE.md`.

### 7.2 Personalized matching — four methods, one weight vector

Rather than one fixed global weight table, a student picks one of four methods on `/match` — **Duels** (head-to-head program picks), **Rank** (drag-order the six factors), **Fit Map** (direct-manipulation sliders over a live SVG scatter plot), or **Interview** (a short AI-guided conversation, with a static-quiz fallback if the AI is unavailable) — each of which produces a personalized `Record<FactorKey, number>` fed into `getRecommendations`' optional weights argument. All four converge through the same `normalizeWeights()` invariant (clamped, smoothed, summing to 1) that `FIT_WEIGHTS` already holds. The result (`{ weights, method }`) is persisted and read by every page that calls the engine, so fit scores stay consistent across Recommendations, Compare, Roadmap, and Saved. Full detail: `docs/RECOMMENDATION_ENGINE.md` §2.5.

### 7.3 The AI advisor — structured analysis and global chat

Two AI features sit beyond the copy-polish layer (§ below), sharing one honest-failure contract (`src/lib/ai/errors.ts`) but serving different needs:

- **Structured advisor** (`POST /api/advisor`) sends the student's full profile — including a free-text field the structured form can't otherwise capture (projects, competitions, research, leadership, goals) — plus a capped, relevant slice of the university database (never the whole dataset) to Gemini, which returns a structured, multi-section personalized analysis (strengths, development areas, per-university analysis, recommended actions, open questions, things to verify). Citations are constrained by the Gemini response schema to only the program ids actually retrieved, then sanitized again server-side before display, so the model can't invent a database source.
- **Global chat advisor** (`POST /api/chat`) is reachable from a floating button in the bottom-right corner of every page, including the profile-less landing page — freeform Q&A about a specific university, the student's own matches, or how Pathlight works, using real multi-turn Gemini `contents` and retrieval widened to match free-text queries. Both live in one drawer (`AdvisorDrawer`), tabbed Chat / Full analysis.

On any failure, the UI shows a real error with a retry option — there is deliberately no template fallback for either feature, since neither a personalized analysis nor a freeform answer has a safe deterministic equivalent to fall back to. Full pipeline, prompt design, and anti-hallucination measures: `docs/AI_USAGE.md`.

### 7.4 De-Bureaucratizer

`/translate` (linked from the NavBar, no profile required) takes pasted admissions or financial-aid text and returns a plain-English rewrite plus a short glossary of the jargon it found (`POST /api/debureaucratize`, `src/lib/ai/debureaucratize*.ts`). Same honesty contract as the other AI features: Zod-validated request (8000-char cap), and a real typed error with a Retry button on any failure (including a Gemini `429`), never a fabricated translation.

### 7.5 Richer program facts on Recommendations and Compare

Programs can carry `valuesSought` (traits the university says it looks for) and `campusLife` (cost of living, on/off-campus housing, neighborhood, social climate), both verification-tagged like every other fact. The Compare page adds an at-a-glance bar-chart panel (`StatBarChart`, patterns not color), a "What they look for" row, and per-university campus-life cards; recommendation cards expose the same details in expandable sections.

### What-If mode
On the Recommendations page, changing the budget or toggling a country updates a local scenario, immediately re-runs the recommendation engine, and shows a "Your path changed" indicator. This demonstrates that matches are computed per-student rather than static.

## 8. Notable engineering fixes

Two real defects were found through browser-driven testing (Playwright), not just type-checking — see `docs/BUILDER_JOURNAL.md` for full detail:

1. **A hydration-timing race** could redirect a user with a saved profile back to the profile form on a direct page load, caused by React rendering a transitional value before a client-side store resync completed. Fixed by making "still loading" distinguishable from "confirmed empty."
2. **A mobile layout defect**: the sticky action bar on the Recommendations page had no opaque background, letting content bleed through at narrow viewport widths. Fixed with a proper fixed, full-width band and reserved padding.

## 9. Verification performed

- `tsc --noEmit` and `eslint` — clean, after the full rebuild.
- `npm test` (Vitest) — 134 tests as of the De-Bureaucratizer/Compare/microtask pass (16 files; the breakdown below describes the 88 from the 2026-09-18 rebuild, plus new `debureaucratize*.test.ts` and extended `metro`/`roadmap` tests): the original 62 (engine scoring/filters/ranking/diagnosis/roadmap, AI advisor retrieval/schema/error-handling via a mocked Gemini client) plus new coverage added in this rebuild — `personalize.test.ts` (weight normalization/ranking/tally math), `duels.test.ts` (pairing generation), `chat.test.ts` and `priorities.test.ts` (mirroring the advisor's mocked-client pattern) — plus extended `recommend.test.ts` cases proving a custom weight vector actually changes ranking. No real network calls in the automated suite.
- `npm run build` succeeds with `/api/explain`, `/api/advisor`, `/api/chat`, and `/api/priorities` all correctly built as dynamic server routes, all other routes static.
- **Full rebuild verified live in-browser (2026-09-18)**, against a real provisioned `GOOGLE_AI_API_KEY`, via a manual Playwright script (screenshots + `console --errors` checks, deleted after use — not committed, same practice as the original build's manual verification): landing → sample profile → diagnosis → match picker → Rank → Duels → recommendations (method label + "Refine matches" link correct) → compare (2 selected) → roadmap → saved → Fit Map (sliders live-reposition the scatter, click-to-inspect works) → Interview (real AI exchange succeeded; a genuine transient Gemini `503` mid-conversation correctly triggered the static-quiz fallback, proving that path fires on a real failure, not just in theory) → global advisor drawer opened from multiple routes, both tabs, a real chat round-trip succeeded, and the structured advisor's honest error state rendered correctly during that same transient `503`. Verified at both desktop and 375px mobile width; zero console errors throughout.
- This pass also caught and fixed two real bugs before they shipped: a label-collision on the Fit Map's y-axis title (fixed by widening the top margin and only labeling the selected point, not every point — see `docs/RECOMMENDATION_ENGINE.md`'s dataviz-informed approach) and a mobile NavBar layout bug where the logo and step-pills interleaved into a garbled multi-line header at 375px (fixed by making the nav its own full-width, horizontally-scrollable row instead of wrapping inline with the logo).

- **De-Bureaucratizer, Compare additions, and roadmap micro-steps verified live in-browser (2026-09-19)** via another deleted-after-use Playwright script: Compare with 3 programs (at-a-glance charts, values row, campus-life cards) and the Roadmap's "Do this right now" card + click-to-expand micro-step checklists rendered correctly. `/api/debureaucratize` returned a correct plain-text rewrite and glossary on a direct call. Gemini intermittently returned `429` during this session (same key, all endpoints); the UI's honest rate-limit error + Retry state rendered correctly, and the request succeeded on retry. `tsc`, `eslint`, `npm test`, and `npm run build` all clean. Also fixed a display bug where four Chinese-program HSK entries rendered as "HSK HSK 4" (data string repeated the test name).

**Not yet verified**: a formal accessibility audit, and a production deployment.

## 10. Summary

Pathlight turns a student's field, country, budget, and constraints into a ranked, explained university shortlist. The matching is a deterministic scoring algorithm over real program data — not an LLM guessing universities — so every recommendation traces back to a specific, visible reason. Changing an input live-updates the shortlist and the roadmap, demonstrating genuine personalization rather than a static list.

## 11. Status

**Built and verified:**
- Full journey: Landing → Profile → Diagnosis → Match (method picker) → [Duels | Rank | Fit Map | Interview] → Recommendations → Comparison → Roadmap (a branching metro-map diagram, not a flat checklist) → Saved programs.
- Deterministic recommendation engine with documented default weights, hard constraints, an optional personalized weight vector, and an automated test suite.
- Four selectable matching methods, each producing a personalized weight vector fed into the same engine — see `docs/RECOMMENDATION_ENGINE.md` §2.5.
- A branching metro-map roadmap: 4 parallel, deterministic tracks (Academic Prep, Portfolio & Achievements, Documents & Funding, Applications & Essays) converging on a "Dream Portfolio" terminus — hand-rolled SVG, lines distinguished by stroke pattern not color, click-to-expand stations, no AI involved in deciding what's on it.
- A De-Bureaucratizer page (`/translate`) that rewrites dense admissions text into plain English with a jargon glossary — see §7.4.
- Compare page with at-a-glance charts, "what they look for", and campus-life cost/housing sections; roadmap stations with ordered micro-step checklists and a "Do this right now" next-move card — see §7.5.
- A global AI advisor drawer, reachable from every page, with a freeform Chat tab (persisted across reloads) and the original structured Full Analysis tab.
- What-If scenario mode with live recompute.
- Data trust system wired end-to-end, now with a non-color (icon + border pattern) encoding for the monochrome design.
- A guided sample-profile entry point for fast evaluation.
- True-monochrome design system (`src/components/ui/*`) — zero color anywhere, status/hierarchy carried by weight, pattern, and icon.
- Mobile-responsive down to 375px, including the advisor drawer and the new `/match/*` flow.
- A retrieval-grounded structured AI advisor (Google Gemini API) — schema-constrained and server-sanitized citations, real (non-disguised) error state on failure. Live-verified against a real key on 2026-09-17, and again as part of this rebuild on 2026-09-18.
- A global freeform chat advisor (Google Gemini API) — real multi-turn conversation, widened retrieval, persisted history. Live-verified 2026-09-18.
- The Interview match method's conversation-to-priority-order extraction, with a live-verified static-quiz fallback on AI failure.
- AI explanation layer (Google Gemini API) with a verified fallback to deterministic copy.
- Saved programs with a dedicated view and filter.
- Request/response schema validation (Zod) at every AI endpoint's server boundary.

**Not yet built:**
- Medicine and Arts program data (no credible sources found for the current university set).
- A hosted database / accounts (local persistence only, by design).
- Production deployment.
- A formal accessibility audit.
- Rate limiting on any AI endpoint.
- Automated visual-regression testing (this rebuild was verified with a manual, deleted-after-use Playwright script, not a committed test suite — see `docs/BUILDER_JOURNAL.md` entry 11).
