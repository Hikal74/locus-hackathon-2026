# Builder Journal

Chronological record of meaningful engineering decisions. Each entry: what changed, why, how, which files, a spoken judge explanation, and honest limitations. See `PROJECT_MASTER_GUIDE.md` for the current-state summary this journal led to.

---

## 1. Scaffold + claymorphism design system

**Decision**: Next.js 16 (App Router, TypeScript, Tailwind v4), scaffolded via `create-next-app`, with a custom claymorphism component library instead of a default UI kit.

**Reason**: The case brief explicitly warns against "vibe-coded" defaults (generic shadcn look, AI-gradient clichés). A small, coherent set of reusable primitives (`ClayButton`, `ClayCard`, `ClayInput`, etc.) driven by CSS custom properties in `globals.css` gives one place to control the entire visual language.

**Implementation**: Design tokens (warm sand/stone palette, dual-shadow "raised"/"recessed" pairs for the tactile clay look) defined as CSS variables, consumed via Tailwind arbitrary-value syntax (`shadow-[var(--shadow-clay-raised)]`).

**Files**: `src/app/globals.css`, `src/components/clay/*`.

**Judge explanation (20s)**: "We built our own small design system instead of using a UI kit off the shelf, so the product has one consistent tactile visual language instead of a generic AI-app look."

**Limitations**: No dark mode yet; palette contrast hasn't had a formal accessibility audit (see `docs/SECURITY.md`/accessibility gap in `PROJECT_MASTER_GUIDE.md` §11).

---

## 2. Deterministic recommendation engine, not an LLM

**Decision**: University matching is a scored, filtered, plain-TypeScript pipeline (`src/lib/engine/`), with zero LLM involvement in deciding which programs appear or how they rank.

**Reason**: The case brief explicitly requires this ("Do NOT allow an LLM to freely invent university recommendations"). It's also just more defensible — a judge can ask "why did this program score X" and get a specific numeric answer.

**Implementation**: Hard filters (field/country/budget ceiling) → six weighted factor scores → weighted sum → template-based explanation grounded in those same scores. See `docs/RECOMMENDATION_ENGINE.md` for the full spec.

**Files**: `src/lib/engine/{recommend,scoring,explain,weights,types}.ts`.

**Data flow**: `StudentProfile` + `universities`/`programs` arrays in → `RecommendationResult` (ranked matches + excluded-with-reason) out. Pure function, no network call, no side effects.

**Alternatives considered**: Sending the profile + dataset to an LLM and asking it to recommend/rank. Rejected — violates the case brief directly, and produces unrepeatable, unexplainable rankings.

**Judge explanation (30s)**: "An algorithm you can read decides the matches, not a model. We filter out anything that can't possibly work — wrong field, wrong country, tuition way over budget — then score everything left on six factors with published weights. The score is a preference match, never an admission probability."

**Limitations**: Fixed weights for every student (no per-student weight adjustment yet); missing profile data defaults to a neutral score rather than being excluded from the average, which slightly compresses scores for incomplete profiles.

---

## 3. Local persistence via a custom `useSyncExternalStore` hook

**Decision**: No database yet. Student profile, roadmap progress, and saved programs live in `localStorage`, accessed through one custom hook (`useLocalStorageValue`) rather than a state-management library.

**Reason**: No external database was provisioned, and a hackathon demo benefits more from zero external dependencies than from persistence surviving a browser wipe. `dataset.ts`'s plain-array export is the one seam that would need to change to add a real database later.

**Implementation**: `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`, with a per-key in-memory cache so `getSnapshot` returns a stable reference when storage hasn't actually changed, and a custom `window` event so multiple components sharing a storage key stay in sync within the same tab.

**Files**: `src/lib/store/local-storage.ts`, `profile-context.tsx`, `saved-programs.ts`.

**Judge explanation (20s)**: "We use React's built-in external-store hook instead of a state library — it's the same primitive React itself uses for things like `useLocation`, and it's enough for what this app actually needs."

**Limitations**: Per-browser, not per-account — clearing browser storage loses everything; no cross-device sync.

---

## 4. Bug: hydration race redirecting users back to `/profile`

**Decision/fix**: Distinguish "still loading" (`undefined`) from "confirmed no profile" (`null`) in the profile store, and only redirect on the confirmed value.

**Reason it happened**: `RequireProfile` redirects when there's no profile. On first render, React shows the *server* snapshot (can't see localStorage) before resyncing to the real client value. `RequireProfile`'s redirect effect is a descendant of `ProfileProvider` and fires *before* the provider's own internal resync effect (child effects run before parent effects in React). Result: the redirect fired on the transitional value even when a real profile existed — reproduced by loading `/roadmap` directly with a saved profile and watching it bounce to `/profile`.

**A second bug hid inside the first fix**: passing `undefined` as a value for a parameter with a JS default (`loadingValue: T = fallback`) silently triggers that default — explicitly-passed `undefined` and omitted-argument are indistinguishable to a default parameter. Fixed by making it a required (non-defaulted) parameter.

**Files**: `src/lib/store/local-storage.ts`, `src/components/layout/RequireProfile.tsx`.

**How it was found**: Not by reading the code — by actually driving the app with Playwright and loading `/roadmap` directly. This is the strongest argument for "verified working," not just "type-checks."

**Judge explanation (30s)**: "We found a real React/SSR timing bug where the app would bounce a logged-in-feeling user back to the start screen, purely by testing it in a real browser instead of trusting that our code looked right. The fix was making 'still checking' and 'confirmed empty' two different values instead of one."

---

## 5. Bug: sticky action bar broken on mobile

**Decision/fix**: Replaced a `position: sticky` bar with no background of its own with a `position: fixed`, full-width, opaque band, plus bottom padding on the scrollable content so it never permanently covers a card.

**Reason it happened**: The bar's buttons had backgrounds but the container div didn't — at 375px width, card text visibly bled through the gaps around the buttons, and the bar had no reserved space, so it always covered part of the last card.

**Files**: `src/app/recommendations/page.tsx`.

**How it was found**: A real (non-fullPage) Playwright screenshot at 375px viewport width — the mobile-responsiveness requirement from the design brief directly caught this.

**Judge explanation (20s)**: "We test at phone width specifically because that's where layout bugs like this actually show up — a desktop-only check would have missed it completely."

---

## 6. AI explanation layer (Claude API), with a verified fallback

**Decision**: Add a real Claude API call that rephrases the deterministic "why it fits"/"watch out" text into warmer prose, strictly forbidden from adding new facts, with the deterministic text as an always-available, verified fallback.

**Reason**: The case brief's own preferred architecture is "structured data + deterministic logic + AI explanation layer," which this directly implements — AI never touches which universities appear or what facts are shown, only how the same facts are phrased.

**Implementation**: `src/lib/ai/explain.ts`'s `rephraseExplanation()` sends the already-computed bullet arrays to Claude with a system prompt that forbids adding facts and demands strict JSON output; the API route (`src/app/api/explain/route.ts`) validates the request shape and always returns usable data — the AI version on success, the original template text on ANY failure (no key, network error, malformed response).

**Files**: `src/lib/ai/{client,explain,use-explain}.ts`, `src/app/api/explain/route.ts`, `src/components/recommendations/RecommendationCard.tsx`.

**Data flow**: Card expand → `useExplain` hook fetches once per distinct fact-set → `/api/explain` → Claude (if configured) → rephrased or original text back → rendered, with a "Phrasing enhanced by Claude" badge only when AI actually ran.

**Current status**: Without an `ANTHROPIC_API_KEY` configured, the product runs entirely in fallback mode — verified working end-to-end in a browser (correct template text, no errors, no badge). The live Claude call path is implemented against the current Anthropic API but requires a provisioned key to exercise. See `docs/AI_USAGE.md`.

**Judge explanation (30s)**: "AI only ever rephrases text our own algorithm already generated and fact-checked — it can't add a new reason, and if the API is unavailable or unconfigured, the exact same correct text shows up instantly from a template. That fallback path is what's actually running in this demo, since no API key is provisioned."

**Limitations**: No automated check that Claude's rephrased output doesn't subtly drift from the source facts beyond the prompt's own instruction and a shape check — a judge-honest gap, documented in `docs/AI_USAGE.md`.

---

## 7. Automated test suite for the engine

**Decision**: Add Vitest and unit-test every pure function in `src/lib/engine/` (32 tests), rather than relying only on manual Playwright verification.

**Reason**: The engine is the single most judge-scrutinized piece of the product ("why should I trust your score?") — it's also the cheapest code in the app to test, being pure functions with no I/O.

**Implementation**: Shared fixtures (`test-fixtures.ts`) for a baseline profile/program/university; tests assert monotonic scoring behavior (more GPA headroom scores higher, etc.), all three hard filters, ranking order, the 0-100 clamp, and the no-admission-probability guarantee.

**Files**: `src/lib/engine/*.test.ts`, `vitest.config.mts`.

**A real bug caught while writing these**: an early version of the budget-cushion test picked a budget/tuition ratio so far over budget that both the with-scholarship and without-scholarship cases clamped to the same floor value (0), making the test unable to actually distinguish the two cases — not a bug in the scoring logic, but in the test's chosen numbers. Fixed by picking a budget where the cushion has room to show up before hitting the floor.

**Judge explanation (20s)**: "The matching algorithm has 32 unit tests covering every scoring rule and every hard filter — we didn't just eyeball that it works, we can prove it with `npm test`."

---

## 8. Favorites / saved programs

**Decision**: A "Save" toggle on every recommendation card, backed by the same shared localStorage hook as the profile, plus a `/saved` page and a "saved only" filter on Recommendations.

**Reason**: Listed as a real product requirement (§18 of the master brief) and a natural companion to the What-If mode — a student exploring scenarios needs a way to keep track of options they liked before the scenario changed.

**Implementation**: `useSavedPrograms()` wraps `useLocalStorageValue` for the `savedPrograms` key — because that hook's store is keyed by storage key, any component calling it (the card, the Recommendations page filter, the `/saved` page) stays in sync automatically, with no prop drilling or shared context needed.

**Files**: `src/lib/store/saved-programs.ts`, `src/components/recommendations/RecommendationCard.tsx`, `src/app/{recommendations,saved}/page.tsx`.

**A bug caught during this pass**: the Recommendations page had computed a `showSavedOnly`/`visibleRecommendations` filter with no UI control to trigger it and a render that still mapped over the unfiltered list — dead, disconnected code. Wired up the missing toggle chip and switched the render to the filtered list.

**Judge explanation (20s)**: "Saved programs use the same sync mechanism as everything else in the app — save a program on one screen and it's already reflected everywhere else, with no extra plumbing."

---

## 9. Migrated the AI explanation layer from Claude to Gemini

**Decision**: Replaced the Anthropic/Claude client in `src/lib/ai/` with the official Google Gen AI SDK (`@google/genai`), targeting Gemini as the single AI provider. `@anthropic-ai/sdk` was removed entirely — there is no second AI provider anywhere in the codebase, and a failed Gemini call is never retried against a different model or vendor.

**Reason**: A deliberate provider switch (not a correctness fix) — Google AI Studio was the preferred provider going forward.

**Implementation**: `client.ts` now lazily constructs a `GoogleGenAI` client from `GOOGLE_AI_API_KEY`, with the model name overridable via `GEMINI_MODEL` (default `gemini-2.5-flash-lite`, Google's stable-GA, lowest-cost model — a good fit for this low-stakes rephrasing task). `explain.ts`'s `rephraseExplanation()` now returns a typed `{ ok: true, data } | { ok: false, reason }` result instead of a bare `null`, so the API route can distinguish and log *why* a call failed (`not_configured`, `invalid_key`, `rate_limited`, `api_error`, `malformed_response`, `network_error`) without ever changing what the client receives. The prompt itself is enforced two ways now: a Gemini `responseSchema` (structured JSON output) plus the same shape-check on our side as before. The deterministic-template fallback behavior — the part that keeps the UI unbroken on any AI failure — is unchanged; it was never a second AI provider, just the app's own already-computed copy.

**Files**: `src/lib/ai/{client,explain}.ts`, `src/app/api/explain/route.ts`, `src/components/recommendations/RecommendationCard.tsx` (badge text), `.env.local.example`, `package.json`.

**Judge explanation (20s)**: "We swapped the AI provider from Claude to Gemini behind the same server boundary — the rest of the architecture, including the rule that AI never invents facts and always has a template fallback, didn't need to change at all."

**Limitations**: Same as before the migration — no automated check that Gemini's rephrased output doesn't subtly drift from the source facts beyond the prompt's instruction and the schema/shape checks. The live Gemini call path is implemented but, as of this entry, still requires a provisioned `GOOGLE_AI_API_KEY` to exercise beyond structural/build verification.

---

## 10. AI advisor: retrieval-grounded reasoning on top of the deterministic engine

**Decision**: Added a genuinely deep AI feature — `POST /api/advisor`, `src/lib/ai/{retrieval,advisor,advisor-prompt,advisor-schema,use-advisor}.ts`, `src/components/advisor/AdvisorPanel.tsx` — where Gemini reasons across the student's complete profile (including a new free-text field) plus a relevant, capped slice of the university database, and produces a structured, personalized analysis. This is architecturally distinct from the §6 rephrasing feature: rephrasing only restates sentences the deterministic engine already wrote; the advisor reasons about things the engine's six fixed factors structurally cannot — free-text achievements, the *combination* of a strength and a gap, what's missing, what to do next.

**The tension this had to resolve**: the case brief (§2's original constraint, still true) forbids an LLM from freely inventing which universities are recommended. The request driving this feature explicitly wanted the AI to be "the actual advisor," not a template-rewriter. The resolution: keep university *eligibility* deterministic — `retrieveContext()` (`retrieval.ts`) reuses the existing, tested `getRecommendations()` pipeline verbatim as a retriever, so the same hard filters and scoring that gate the recommendation cards also gate what Gemini is even shown. Gemini never adds, removes, or reorders which programs are in scope; it reasons about *why* the already-filtered set matters to this specific student, which is where the real depth was missing before.

**Anti-hallucination, concretely**: Gemini's `responseSchema` constrains every citation (`programId`) to an `enum` of exactly the ids retrieved for that request — it's structurally unable to cite a program it wasn't shown. The parsed response is re-validated with Zod (`advisor-schema.ts`) independent of schema conformance, and citations are sanitized a second time server-side (`sanitizeCitations()`) by intersecting against the real retrieved-id set — the UI's "Based on our university database" list is built by looking up the real university/program name from the dataset by id, never by trusting Gemini's own text.

**No fallback, by design**: unlike rephrasing, the advisor has no deterministic-template fallback — there's no safe equivalent of a personalized multi-section analysis to fall back to, so a Gemini failure surfaces as a real, typed error (`not_configured` / `invalid_key` / `rate_limited` / `api_error` / `malformed_response` / `network_error`) with a retry action, never a disguised non-AI answer.

**Files**: `src/lib/ai/{retrieval,advisor,advisor-prompt,advisor-schema,use-advisor}.ts`, `src/app/api/advisor/route.ts`, `src/components/advisor/AdvisorPanel.tsx`, `src/components/clay/ClayTextarea.tsx`, `src/app/profile/page.tsx` (new free-text step), `src/lib/data/types.ts` (`StudentProfile.additionalContext`), `src/app/recommendations/page.tsx` (panel wiring), `src/lib/ai/client.ts` (shared model default raised to a flash-tier model).

**A design call worth flagging**: the model default (`GEMINI_MODEL`, in `client.ts`) is shared between both Gemini features. Raising it from a lite-tier model to a flash-tier one was made for the advisor's sake (its reasoning task needs more than the cheapest tier reliably gives) but applies to rephrasing too, since they share one env var — a reasonable side effect, not a separate decision.

**Judge explanation (30s)**: "The database still decides which universities are eligible — that part never changed, and it's still fully deterministic and testable. What's new is that instead of a handful of template sentences, Gemini actually reasons across the student's whole story — including things like project experience or competition history that a scoring formula can't parse — grounded in that same filtered evidence. If Gemini fails, we show a real error, not a fake AI answer wearing the old template's clothes."

**Limitations**: Follow-up conversation history is in-memory only (lost on reload). No automated factual-drift check on the advisor's prose beyond the system prompt's rules and citation sanitization — same category of honest gap as the rephrasing feature.

**Update, 2026-09-17 — live-verified against a real key**: once a real `GOOGLE_AI_API_KEY` was provisioned, live testing caught two real bugs neither the mocked test suite nor an unconfigured-server check could have: (1) `AI_MODEL`'s `process.env.GEMINI_MODEL ?? default` didn't fall back for an empty-but-set `GEMINI_MODEL=` in `.env.local` — `??` only catches `null`/`undefined`, not `""` — fixed by switching to `||`; (2) the originally-chosen default model had already been retired for new API keys by the time this ran live, surfaced directly by Google's own 404 error naming its replacement. Both fixed in `src/lib/ai/client.ts`. After both fixes, a real end-to-end call succeeded: a grounded, correctly-cited, personalized analysis referencing real retrieved program ids, including an honest uncertainty flag for a genuine data conflict (KBTU's two disagreeing IELTS minimums) rather than silently picking one. Everything up to the live model call (retrieval, request/response validation, error classification, citation sanitization) remains covered by `src/lib/ai/{retrieval,advisor,advisor-schema}.test.ts` (30 tests, Gemini client mocked); the live call itself is now also verified, not just structurally plausible. See `docs/AI_USAGE.md` for the full incident writeup.

---

## 11. Complete rebuild: true-monochrome design, personalized-weight matching, global advisor drawer

**Decision**: A ground-up rebuild across three axes, requested directly: (1) a more advanced, original way for students to find their matches than one static form, (2) an AI advisor reachable from every page via a persistent right-corner drawer, able to answer any question, and (3) a strict black-and-white visual system. Scope was clarified with the user up front: all four originally-proposed matching concepts should ship as student-selectable methods, not just one — see `docs/RECOMMENDATION_ENGINE.md` §2.5 for what each produces.

**Design system**: `src/app/globals.css`'s warm-sand "clay" palette and 4-part neumorphic shadow system were replaced entirely with true grayscale tokens (`--color-ink`/`--color-paper`/a gray step scale) and a flat, hard-offset-shadow "editorial" look. All 8 `src/components/clay/Clay*.tsx` components were ported into `src/components/ui/*` with the *same prop APIs* (so most call sites only changed their import path), with tone/variant semantics remapped to fill-weight, border pattern (solid/dashed/dotted), and icon instead of hue — `VerificationBadge`'s three trust states in particular needed a genuinely distinct non-color encoding, not just a recolor, since `docs/DATA_AND_TRUST.md` requires the distinction survive. New primitives (`Slider`, `Tabs`, `Drawer`, a hand-rolled `icons.tsx`) were added the same way, with zero new npm dependencies — consistent with the codebase's existing minimal-dependency stance (no `clsx`, no DnD library, no chart library). The old `src/components/clay/` directory was deleted once every import was migrated.

**Personalized matching**: `getRecommendations` gained an optional weight-vector parameter (defaulting to the existing `FIT_WEIGHTS`) instead of importing a hardcoded constant — the six per-factor scoring functions needed no changes, since they were already pure and weight-agnostic. Four new `/match/*` pages each produce a weight vector through a different mechanic (duels, drag-rank, direct sliders, AI-guided interview — see `docs/RECOMMENDATION_ENGINE.md` §2.5) and persist it (`useMatchWeights`, mirroring the existing `useSavedPrograms` pattern) for every downstream page to read. This is a genuine capability increase, not just new UI: a student who says "budget is my only concern" now gets a shortlist that actually reflects that, rather than the same fixed 0.20 budget weight everyone gets.

**Global advisor drawer**: The AI advisor's reach was widened from "triggered on the Recommendations page" to "one floating button, every route" (`AdvisorLauncher`/`AdvisorDrawer`, mounted once at the root layout). Rather than rebuild the existing, tested structured-advisor pipeline (retrieval, prompt, schema, citation sanitization — see entry §10) to fit a chat shape, it was kept as-is and relocated into the drawer's "Full analysis" tab; a new sibling, "Chat" (`src/lib/ai/chat.ts`, `POST /api/chat`), handles freeform questions with real multi-turn `contents` and retrieval widened to match free-text queries, not just the active profile. See `docs/AI_USAGE.md` §2 for the full reasoning.

**Judge explanation (30s)**: "We rebuilt the whole product around one idea: don't make the student fill out a form and hope the weights we chose match what they actually care about. Now they pick how they want to tell us — duels, ranking, live sliders, or just talking to the AI — and that becomes their actual weight vector, feeding the same tested scoring engine as before. The AI advisor moved from one page to a drawer that's always one click away, everywhere, and the whole thing is intentionally black-and-white so nothing about it reads as a generic AI-gradient demo."

**Limitations**: No automated visual-regression suite — this rebuild was verified via a manual Playwright script (screenshots + console-error checks across the full flow at desktop and 375px widths, plus a live end-to-end AI pass, since a real `GOOGLE_AI_API_KEY` was available this session), deleted after use rather than committed, matching how the original build's manual browser verification was handled (see entry above and `docs/PROJECT_MASTER_GUIDE.md` §9). The Duels method's pairing heuristic is a reasonable proxy, not a formally anti-dominated pair — see `docs/RECOMMENDATION_ENGINE.md`'s "Known limitations."

---

## 12. Roadmap rebuilt as a branching metro map

**Decision**: Replaced the flat Now/Next/Later checklist on `/roadmap` with a metro-map diagram — 4 parallel lines (Academic Prep, Portfolio & Achievements, Documents & Funding, Applications & Essays) converging on a "Dream Portfolio" terminus station. Requested directly, with one explicit constraint: it must not read as "a basic GPT wrapper where it's just recommendations and text." Clarified with the user across 3 questions before building — parallel converging tracks (not a branching skill-tree or one-line-per-university), tasks sourced deterministically (engine gaps + a new fixed activity library, no AI deciding what appears), and click-to-expand-plus-check-off interactivity (not sub-checklists or guided wizards).

**Why deterministic, concretely**: `buildRoadmap()` (`roadmap.ts`) already existed and needed no changes — it derives tasks from real requirement gaps (`watchOut`) and fixed application/document/scholarship tasks. The only real gap was "portfolio-building" (projects, competitions, research, leadership) having no structured signal anywhere in the profile to derive from. Rather than have an LLM invent personalized-sounding suggestions from the free-text field (which would have made this exactly the "GPT wrapper" the user ruled out), `buildPortfolioTasks()` is a fixed library of 5 activities, field-name-substituted via the existing `FIELD_LABELS` lookup — the only personalization beyond that is reading the student's own `prioritizeResearch` boolean (a structured field, not free-text inference) to reword one task's rationale.

**The metro map itself is a pure grouping transform** (`metro.ts`) over the combined task list — `buildMetroMap()` sorts the same `RoadmapTask[]` into 4 lines by category (mirroring the readiness buckets `computeReadiness` already used, plus the new portfolio line), and `MetroMap.tsx` draws it as hand-rolled inline SVG: no charting library, same approach as the Fit Map scatter chart (entry §11). Lines are told apart by **stroke pattern, not color** (solid / dashed / dotted / dash-dot) — the same monochrome-safe identity encoding used everywhere else in this design system — each rail bending into a shared diagonal trunk that meets the terminus node, which fills in once every station on every line is checked off.

**Files**: `src/lib/engine/roadmap.ts` (`buildPortfolioTasks`, extended `RoadmapCategory`/`BUCKET_CATEGORIES`), `src/lib/engine/metro.ts` (new), `src/components/roadmap/MetroMap.tsx` (new), `src/app/roadmap/page.tsx` (rewritten). The `completedIds` localStorage key (`STORAGE_KEYS.roadmapProgress`) is unchanged, so a returning user's existing checked-off tasks aren't lost by this rebuild.

**Judge explanation (20s)**: "The roadmap used to be a checklist. Now it's four tracks — academics, portfolio, documents, applications — that all lead to one destination, and you can see at a glance which track needs the most work. Every task on it still traces back to a real requirement gap or a fixed activity, never an AI guess."

**Limitations**: The portfolio activity library is intentionally generic (5 fixed activities per field, not per-student) — it's aspirational scaffolding, not a personalized plan, and says so implicitly by being the same 5 items for every student in that field. Verified via the same manual, deleted-after-use Playwright approach as entry §11 (station click/expand, mark-complete persists across a reload, mobile horizontal scroll, zero console errors) — no committed visual-regression suite yet, same known gap.
