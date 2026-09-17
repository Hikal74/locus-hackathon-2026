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
