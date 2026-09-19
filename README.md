# Pathlight

**Your university path, without the guesswork.**

Pathlight turns a student's field of study, target countries, budget, and constraints into a ranked shortlist of university programs, the specific reasons each one fits, and a roadmap for what to do next. Every fact it shows is labeled by how much we trust it.

Built for **LOCUS Hackathon 2026, Case 02 — Personalized University Admissions Route**. Pathlight is an independent product name and is not affiliated with the LOCUS platform.

---

## For judges: a 2-minute tour

```bash
npm install
npm run dev          # http://localhost:3000
```

1. On the home page, click **Try a sample profile** (a ready-made student: 17, Computer Science, considering Kazakhstan / USA / China, $18,000/year budget). No typing needed.
2. **Diagnosis** — strengths, constraints and gaps read straight from the profile.
3. **University match** — open a card's **Details** to see why it fits, its report card, and what the university looks for. Try the filters, the **Reach / Match / Safety** chips, and **Sort by**.
4. Pick two or three programs and use the floating bar to **Compare** them side by side.
5. **Roadmap** — four parallel tracks converging on an application-ready portfolio, with a "Do this right now" step.
6. **Deadlines** — every known deadline for your matches, with a calendar download.
7. Open the **Tools** menu for the helper tools, and the chat button (bottom right) for the AI advisor.

The AI features need a Gemini API key (see [Setup](#setup)). Everything else — matching, comparison, roadmap, deadlines — works without one.

---

## The problem

Choosing between universities in several countries means comparing different costs, languages, exam systems, and deadlines. Generic search sites list everything with no personalization, and a chatbot can confidently invent facts it doesn't actually know. Students end up with a long list, unclear trust in the numbers, and no idea what to do first.

## Our approach: three questions

| Question | How Pathlight answers it |
|---|---|
| **Where** | Only programs that fit *this* student's field, countries, and budget — not a directory of everything. |
| **Why** | Each match shows the specific, traceable reasons it appeared, plus what to watch out for. |
| **What next** | A roadmap that always names the single next step, instead of fifty tasks. |

---

## What's in the product

| Area | Route | What it does |
|---|---|---|
| Home | `/` | Explains the idea, shows live engine output for a sample student, and how the product works. |
| Profile | `/profile` | A 10-step questionnaire in four effort levels (quick demographics → preferences → career goals → metrics and exams). Only choosing at least one country is required. |
| Diagnosis | `/diagnosis` | Snapshot of your answers with strengths, constraints, and gaps. |
| University match | `/universities` | Ranked programs with filters (countries, budget, Reach/Match/Safety, saved), sorting, dense result cards, and a tabbed details panel. Changing budget or countries re-ranks live. |
| Compare | `/compare` | Side-by-side tradeoffs for up to three programs — deliberately not a "best pick". |
| Roadmap | `/roadmap` | Four deterministic tracks (Academic Prep, Portfolio & Achievements, Documents & Funding, Applications & Essays) converging on a "Dream Portfolio", broken into checkable micro-steps. |
| Deadlines | `/deadlines` | Timeline of all known deadlines, estimated dates flagged, passed dates separated, `.ics` export. |
| Saved | `/saved` | Bookmarked programs, re-scored if your profile changes. |
| AI advisor | floating button | Chat tab (freeform Q&A) and Full analysis tab (structured, personalized review of your profile). |

**Helper tools** (all under the **Tools** menu; none need a profile):

| Tool | Route | What it does |
|---|---|---|
| Professor Vibe Check | `/vibe-check` | Summarizes an instructor's teaching style **only from reviews, syllabus text, or grade numbers you paste**. Each trait shows its evidence; anything the sources don't cover is marked "not enough info" rather than guessed. |
| Essay Coach | `/essay-coach` | Feedback on clarity, specificity, voice, and structure, quoting the exact passages. It coaches; it never writes or rewrites the essay. Quoted passages are verified against the draft server-side. |
| Interview practice | `/interview` | Real admissions questions (field-specific first), feedback on your answer, and a realistic follow-up. It never supplies a "model answer". |
| De-Bureaucratizer | `/translate` | Rewrites dense admissions or financial-aid text in plain English with a glossary of the jargon. |

---

## How the matching works

**No AI decides which universities appear.** The ranking is plain, auditable TypeScript over structured data (`src/lib/engine/`):

1. **Hard filters** remove programs that cannot work: wrong field of study, a country you didn't select, or tuition beyond **3× your stated budget**. The number of filtered-out programs is shown.
2. **Six factors**, each scored 0–100, are computed for every survivor.
3. A **weighted sum** produces the fit score. The weights are fixed and published:

| Factor | Weight |
|---|---|
| Academic fit | 25% |
| Interest fit | 20% |
| Budget fit | 20% |
| Requirement readiness | 15% |
| Location fit | 10% |
| Preference fit | 10% |

4. **Explanations** ("why it fits", "watch out") are generated strictly from those computed numbers.

The same profile always gives the same ranking. Full specification and a worked example: [`docs/RECOMMENDATION_ENGINE.md`](docs/RECOMMENDATION_ENGINE.md).

### What the fit score is — and isn't

- The fit score is a **preference-match score**: how well a program fits what you asked for. It is **never an admission probability**, and the interface says so wherever it appears.
- **Reach / Match / Safety** compares your GPA with each program's published minimum, asking for a bigger cushion at more selective programs. It ignores essays, exams, and activities, so it's a guide to where to aim, not a prediction. If your GPA or the program's minimum is missing, it says "unknown" instead of guessing.
- **A–F report cards** (cost, academic fit, campus life) reuse the engine's own scoring plus a transparent rule of thumb over cost of living and housing. Each grade shows the numbers it came from. They are computed from our own data, not scraped reviews.

## Data and trust

The dataset covers **33 programs at 9 universities in 3 countries (USA, Kazakhstan, China) across 6 fields** (Computer Science, Business, Engineering, Natural Sciences, Humanities, Arts). Medicine is not covered: we found no credible data for these institutions and chose to report a gap rather than invent one.

Every fact that can go stale (tuition, deadlines, requirements, minimum GPA, living costs) carries a visible trust label:

| Label | Meaning |
|---|---|
| **Verified** | Confirmed against a specific official page, with the link and date recorded. |
| **Needs verification** | From a secondary source — likely close, but not confirmed current. |
| **Demo data** | No reliable figure was found, so an estimate is shown and labeled as one. |

Derived values (such as a report-card grade) inherit the **weakest** label among their inputs. Per-university breakdown: [`docs/DATA_AND_TRUST.md`](docs/DATA_AND_TRUST.md).

## How AI is used

Google Gemini is the only AI provider, called only from server routes. It reasons over or rephrases things the deterministic engine has already decided; it never chooses which programs appear or how they are scored.

| Endpoint | Purpose | If the AI call fails |
|---|---|---|
| `/api/advisor` | Structured, personalized analysis of your profile, grounded in a capped slice of the database; citations are constrained to real program ids and sanitized server-side. | Honest error with Retry. |
| `/api/chat` | The chat advisor, with real multi-turn context. | Honest error with Retry. |
| `/api/explain` | Rephrases already-computed "why it fits" text into warmer prose. | Falls back to the deterministic template text. |
| `/api/vibecheck` | Professor Vibe Check. | Honest error with Retry. |
| `/api/essaycoach` | Essay Coach. | Honest error with Retry. |
| `/api/interview` | Interview practice. | Honest error with Retry. |
| `/api/debureaucratize` | De-Bureaucratizer. | Honest error with Retry. |

There is deliberately no fallback that dresses up non-AI output as an AI answer. Every endpoint validates its request with Zod, treats pasted text as delimited data (a guard against prompt injection), and validates the model's response before showing it. Details: [`docs/AI_USAGE.md`](docs/AI_USAGE.md).

## Privacy and security

- Your profile, saved programs, and roadmap progress live only in your browser (`localStorage`). There are no accounts and no database.
- Text is sent to Google's Gemini API only when you use an AI feature, and only what that feature needs.
- The API key is read server-side from `.env.local`, which is gitignored. Details: [`docs/SECURITY.md`](docs/SECURITY.md).

---

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zod, Vitest, ESLint, and the Google Gen AI SDK (`@google/genai`). No database, no state library, no UI or icon library — icons, charts, and the roadmap diagram are hand-written SVG/CSS.

The interface uses a strict black-and-white design system: hierarchy and status are carried by weight, border pattern, and icon rather than color alone.

### Project structure

```
src/
  app/                 Routes (pages) and the seven /api route handlers
  components/          UI: layout, landing, recommendations, roadmap, insights, tools
    ui/                Design-system primitives (Button, Card, Badge, Tabs, ...)
  lib/
    engine/            Deterministic matching: filters, scoring, tiers, report cards,
                       roadmap, deadlines, sorting (+ tests beside each module)
    ai/                Gemini calls, prompts, Zod schemas, error taxonomy (+ tests)
    data/              Dataset, types, sample profile, onboarding steps, question bank
    store/             localStorage-backed state (profile, saved programs, progress)
docs/                  Architecture, engine spec, AI usage, data trust, security
```

---

## Setup

Requires **Node.js 20.9 or newer**.

```bash
npm install
cp .env.local.example .env.local     # then edit .env.local
npm run dev                          # http://localhost:3000
```

On Windows you can instead double-click `START_HERE.bat`, which installs dependencies, builds, starts a production server, and opens the browser.

### Environment variables

```
GOOGLE_AI_API_KEY=   # enables the AI features (get one at https://aistudio.google.com/apikey)
GEMINI_MODEL=        # optional; defaults to gemini-3.6-flash
```

Without a key the app still runs: matching, comparison, roadmap, and deadlines are unaffected, "why it fits" text falls back to the deterministic template, and the AI advisor and helper tools show a clear "not configured" error.

The free Gemini tier limits how many requests each model allows per day. If you see a "receiving a lot of requests" message, wait a moment or set `GEMINI_MODEL` to another available model.

### Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm test         # Vitest: 212 tests across 22 files
npm run lint     # ESLint
```

## Testing

The 212 automated tests cover the deterministic engine (hard filters, scoring, ranking, tiers, report cards, roadmap, deadlines including the `.ics` builder, sorting) and every AI endpoint's logic — request and response validation, prompt framing, error classification, and the sanitizers — against a mocked Gemini client, so the suite makes no network calls. The user interface was additionally exercised in a real browser at desktop and 375–390px phone widths.

## Known limitations

- The dataset is a focused set, and some figures are still labeled *Needs verification* or *Demo data*. Deadlines in the dataset have no per-item trust label, so estimated windows are flagged from their wording.
- No accounts or cross-device sync; state is per-browser.
- AI features depend on a Gemini API key and its quotas.
- Not yet done: a formal accessibility audit, rate limiting on the AI endpoints, and automated browser tests.
- This repository does not include a hosted deployment; it runs as a standard Next.js application.

## Documentation

- [`docs/PROJECT_MASTER_GUIDE.md`](docs/PROJECT_MASTER_GUIDE.md) — current-state technical overview of everything above
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture and stack rationale
- [`docs/RECOMMENDATION_ENGINE.md`](docs/RECOMMENDATION_ENGINE.md) — scoring specification and worked example
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — AI integration and failure behavior
- [`docs/DATA_AND_TRUST.md`](docs/DATA_AND_TRUST.md) — data verification model
- [`docs/SECURITY.md`](docs/SECURITY.md) — secrets handling and data boundaries
- [`docs/BUILDER_JOURNAL.md`](docs/BUILDER_JOURNAL.md) — engineering decision log
