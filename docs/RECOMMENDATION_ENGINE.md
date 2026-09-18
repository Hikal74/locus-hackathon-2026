# Recommendation Engine

The entire matching pipeline lives in `src/lib/engine/` and is plain, synchronous TypeScript — no network call, no LLM, fully unit-tested (`src/lib/engine/*.test.ts`). This document is the algorithm's specification; if this document and the code ever disagree, the code is right and this needs updating.

## Pipeline

`getRecommendations(profile, universities, programs)` in `recommend.ts`:

### 1. Hard filters (`hardFilterReason`)

A program is removed entirely — before any scoring — if any of these are true:

- `program.field !== profile.intendedField`
- `!profile.countryPreferences.includes(university.country)`
- `program.tuitionPerYearUSD.value > profile.budgetPerYearUSD * BUDGET_HARD_CEILING_MULTIPLIER` (constant = 3, in `weights.ts`) — beyond 3x stated budget, no realistic scholarship closes the gap, so the option is excluded rather than merely scored low.

Excluded programs are returned separately (`RecommendationResult.excluded`) with a human-readable reason, and the UI surfaces a count of them rather than hiding them silently.

### 2. Six weighted factors (`scoring.ts`), each 0-100

| Factor | Weight | Function | What it measures |
|---|---|---|---|
| Academic fit | 0.25 | `academicFit` | Student GPA vs. the program's published (or estimated) minimum. Neutral (60) if either is unknown — missing data is never penalized as if it were a weak match. |
| Interest fit | 0.20 | `interestFit` | Overlap between the student's chosen interest tags and the program's `tags`. Floors at 30 (not 0) on zero overlap, since a program can still fit on other factors. |
| Budget fit | 0.20 | `budgetFit` | How comfortably tuition sits under budget; a cushion is added when over budget IF the program has a scholarship whose `competitiveness` isn't `"high"` (i.e. plausibly accessible). |
| Requirement readiness | 0.15 | `requirementsFit` | Fraction of the program's language/exam requirements the student has already satisfied (per `languageLevel`/`examsCompleted`). Also returns the list of unmet requirements as `gaps`, which feed both the "watch out" copy and the roadmap. |
| Location fit | 0.10 | `locationFit` | Rewards the university's country matching the student's *ranked* preference order — 1st choice scores 100, 2nd scores 80, 3rd+ scores 60. A country not in the list scores 0 (should already be hard-filtered out by this point). |
| Preference fit | 0.10 | `preferencesFit` | Research emphasis, scholarship availability, campus size vs. the student's stated soft preferences (`profile.preferences`). |

Weights are declared once in `weights.ts` as `FIT_WEIGHTS` (the default/fallback) and sum to 1.0 — this is the single source of truth other docs (and this file) should reference rather than re-stating numbers that could drift.

### 2.5 Weights (`weights.ts`)

`getRecommendations` takes an optional 4th argument, `weights: Record<FactorKey, number>`, used in place of `FIT_WEIGHTS` — everything else in the pipeline (hard filters, per-factor scoring, explanation text) is unchanged and weight-agnostic. **Removed:** an earlier build let a student arrive at a personalized weight vector via one of four methods (Duels, Rank, Fit Map, AI Interview) on a `/match` picker page; that whole subsystem (the picker, all four method pages, `personalize.ts`, `duels.ts`, `priorities.ts`) was removed to simplify the product flow — see `docs/BUILDER_JOURNAL.md`. Every profile now uses the balanced `FIT_WEIGHTS` default; `useMatchWeights` (`src/lib/store/match-weights.ts`) is kept as the one place downstream pages read weights from, in case a personalized method is reintroduced later.

### 3. Fit score

`fitScore = round(Σ factor.score × weights[factor.key])`, 0-100, using either the personalized vector above or the `FIT_WEIGHTS` default.

**This is a preference-match score, not an admission probability.** It answers "how well does this fit what you told us," never "how likely are you to get in." This distinction is enforced in UI copy everywhere the score appears (Diagnosis, Recommendations, Roadmap readiness) — see `docs/DATA_AND_TRUST.md`.

### 4. Explanation (`explain.ts`)

`buildWhyItFits` and `buildWatchOut` read the **already-computed** factor scores and requirement gaps and only emit a sentence when a specific threshold is crossed (e.g. "comfortably meets this program's typical admitted range" only appears if `academic` score ≥ 80). Nothing here is generated freely — every sentence traces back to a number the engine computed in step 2. This structured text is what the optional AI layer (`docs/AI_USAGE.md`) is allowed to rephrase, and explicitly forbidden from adding to.

## What-If / scenario mode

On the Recommendations page, changing budget or toggling a country updates a local `scenario` copy of the profile and immediately re-runs `getRecommendations` — it's cheap (a few dozen programs, synchronous, no network), so there's no debounce needed. The change is also persisted back to the real profile via context, and a "Your path changed" banner appears, diffed against a snapshot of the profile taken when the page first loaded. This is the concrete proof that matches are computed per-student, not static — a judge can change one input and watch the ranked list and later the roadmap change in front of them.

## Downstream consumers

- **Diagnosis** (`diagnosis.ts`) does not call the recommendation engine — it's a separate, simpler read of the raw profile (strengths/constraints/gaps), shown before recommendations exist conceptually.
- **Roadmap** (`roadmap.ts`) calls `getRecommendations` itself and builds tasks from the **top 3** matches' `watchOut` gaps and deadlines — deliberately not the full shortlist, to keep the task list short per the case brief's "one clear next action, not fifty tasks" requirement. `buildPortfolioTasks(profile)` adds a fixed, field-tailored set of portfolio-building activities alongside it (no engine/AI involvement — same 5 activities for everyone in that field, see `docs/ARCHITECTURE.md`). `metro.ts`'s `buildMetroMap()` then regroups the combined task list into 4 parallel lines (Academic Prep, Portfolio & Achievements, Documents & Funding, Applications & Essays) for the `/roadmap` page's metro-map diagram — a pure presentation transform, no new task-generation logic of its own.
- **Compare** re-runs `getRecommendations` against the full stored profile and filters to the selected program ids from the URL query string, rather than passing recommendation objects through navigation state.

## Known limitations of the current algorithm

- `academicFit`/`interestFit` are the only factors sensitive to a missing profile field defaulting to "neutral" rather than being excluded from the weighted average — this means a profile with lots of missing data gets scored as if those factors were mediocre rather than unknown, which slightly compresses scores toward the middle for incomplete profiles. Worth revisiting if this becomes a demo issue.
- **`gpaOn4Scale` assumes a literal 4.0 scale with no conversion**, and nothing in the profile form enforces that beyond a label and an HTML `max` hint that doesn't actually block a larger value from being typed and saved. This is a real gap for exactly the audience this product targets — Kazakhstan (one of the three countries in scope) commonly grades on a 5-point or other non-4.0 scale, not the US-style 4.0 GPA the engine assumes. A student who enters their real, out-of-scale GPA gets a silently wrong `academicFit` score (an out-of-range value that happens to exceed every program's minimum will score as a perfect academic match, not flagged as suspicious) — `academicFit` in `scoring.ts` has no bounds-checking on its input, unlike the AI request schemas (`advisor-schema.ts`), which clamp an out-of-range value into `[0, 4]` rather than reject the request, specifically so one bad legacy value doesn't take down the entire AI advisor (see fix history). The clamp is a safe floor for the AI layer, not a fix for the underlying scoring accuracy — a real GPA-scale-conversion feature (ask the student's grading scale, convert properly) would be the correct fix and hasn't been built.
