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
| AI integration | Claude API used as an optional copy-polish layer, with a deterministic template as an automatic, verified fallback | No LLM decides which universities appear — see §7. The fallback path runs whenever no API key is configured and has been verified end-to-end; see `docs/AI_USAGE.md`. |
| Dataset scope | 26 real programs across 5 fields (Computer Science, Business, Engineering, Natural Sciences, Humanities) at 9 universities in the USA, Kazakhstan, and China | Broad enough to demonstrate genuine cross-field, cross-country personalization without the scope of a full catalog. Medicine and Arts have no credible data for these institutions and are reported as a gap rather than filled with placeholders — see `docs/DATA_AND_TRUST.md`. |

## 4. Architecture overview

```
Next.js 16 (App Router) + TypeScript + Tailwind v4
                    |
        React Context (ProfileProvider)
                    |
        localStorage (via useSyncExternalStore)
                    |
   ┌────────────────┼─────────────────┐
   |                |                 |
Structured data   Deterministic    UI (clay design
(dataset.ts)       engine           system components)
                 (hard filters →
                  weighted scoring →
                  explanation text)
```

**No LLM sits between the student and a recommendation.** The entire matching pipeline — filtering, scoring, ranking, "why it fits" text — is plain TypeScript over structured data. AI sits on top only as a copy/tone layer (see §7 and `docs/AI_USAGE.md`), never as the source of which universities appear.

### Stack rationale
- **Next.js App Router** — one framework for routing, rendering, and the single server endpoint the app needs (`/api/explain`).
- **Tailwind v4 + CSS custom properties** — the design system's shadows, colors, and radii are defined once as CSS variables in `globals.css`, keeping the entire visual language in one file.
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

Hard filters (field, country, budget ceiling) remove programs that can't work at all; six weighted factors (academic fit, interest fit, budget fit, requirement readiness, location fit, preference fit — weights documented in `src/lib/engine/weights.ts`, summing to 1.0) score everything that survives; explanation text is generated strictly from those computed numbers. **The fit score is a preference-match score, never an admission probability** — enforced in UI copy and covered by tests. Full specification and worked example: `docs/RECOMMENDATION_ENGINE.md`.

### What-If mode
On the Recommendations page, changing the budget or toggling a country updates a local scenario, immediately re-runs the recommendation engine, and shows a "Your path changed" indicator. This demonstrates that matches are computed per-student rather than static.

## 8. Notable engineering fixes

Two real defects were found through browser-driven testing (Playwright), not just type-checking — see `docs/BUILDER_JOURNAL.md` for full detail:

1. **A hydration-timing race** could redirect a user with a saved profile back to the profile form on a direct page load, caused by React rendering a transitional value before a client-side store resync completed. Fixed by making "still loading" distinguishable from "confirmed empty."
2. **A mobile layout defect**: the sticky action bar on the Recommendations page had no opaque background, letting content bleed through at narrow viewport widths. Fixed with a proper fixed, full-width band and reserved padding.

## 9. Verification performed

- `tsc --noEmit` and `eslint` — clean.
- `npm test` (Vitest) — 32 tests across scoring, hard filters, ranking, diagnosis, and roadmap generation.
- The full user journey driven end-to-end in headless Chromium: landing → sample profile → diagnosis → recommendations → what-if change → comparison → roadmap → saved programs. Zero console errors, including at a 375px mobile viewport.
- The AI fallback path (no API key configured) verified live in a browser: correct text displays instantly with no errors.

**Not yet verified**: the live Claude API call itself (requires a provisioned key), a formal accessibility audit, and a production deployment.

## 10. Summary

Pathlight turns a student's field, country, budget, and constraints into a ranked, explained university shortlist. The matching is a deterministic scoring algorithm over real program data — not an LLM guessing universities — so every recommendation traces back to a specific, visible reason. Changing an input live-updates the shortlist and the roadmap, demonstrating genuine personalization rather than a static list.

## 11. Status

**Built and verified:**
- Full required journey: Landing → Profile → Diagnosis → Recommendations → Comparison → Roadmap → Next Action → Progress → Saved programs.
- Deterministic recommendation engine with documented weights, hard constraints, and an automated test suite.
- What-If scenario mode with live recompute.
- Data trust system wired end-to-end.
- A guided sample-profile entry point for fast evaluation.
- Custom claymorphism design system.
- Mobile-responsive down to 375px.
- AI explanation layer (Claude API) with a verified fallback to deterministic copy.
- Saved programs with a dedicated view and filter.

**Not yet built:**
- Live verification of the Claude API call path (fallback path is what has been exercised).
- Medicine and Arts program data (no credible sources found for the current university set).
- A hosted database / accounts (local persistence only, by design).
- Production deployment.
- A formal accessibility audit.
