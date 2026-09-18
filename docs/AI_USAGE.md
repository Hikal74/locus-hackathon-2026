# AI Usage

Pathlight uses Google Gemini in four places, all server-side, all with a single provider and no secondary AI fallback: the structured advisor, the global freeform chat advisor, the Interview match-method's priority extraction, and the explanation-rephrasing layer. This document covers the structured advisor first (the original, most-documented pipeline), then the chat advisor that now wraps it in a global drawer, then the two smaller features.

## 1. The AI advisor — retrieval-grounded reasoning, not a template

### What it is

A real advisory layer: `POST /api/advisor` sends a student's full profile (including free text) plus a small, relevant slice of the university database to Gemini, and Gemini reasons across all of it to produce a personalized, structured analysis — strengths, development areas, per-university analysis, recommended actions, open questions, and things to verify. This is not the deterministic recommendation engine (`docs/RECOMMENDATION_ENGINE.md`) rephrased; it's a genuinely different kind of output, capable of reasoning about things the engine's six fixed factors structurally cannot — free-text achievements, projects, competitions, the *combination* of a strength and a gap, and so on.

**The database still decides which universities are eligible.** Gemini does not invent, add, or reorder which programs are "in scope" — that's still the same tested, deterministic hard-filter + scoring pipeline (`getRecommendations`) the rest of the product uses. What's new is that Gemini reasons *about* that already-filtered evidence instead of the product only ever showing template sentences triggered by score thresholds. This split matters for a reason bigger than architecture: the hackathon case brief explicitly requires that an LLM never freely invent which universities are recommended (see `docs/BUILDER_JOURNAL.md` §2) — so university eligibility stays deterministic and auditable, while the depth and personalization of the *explanation* comes from Gemini.

### Pipeline

```
Student profile (incl. free-text additionalContext)
        │
        ▼
retrieveContext() — src/lib/ai/retrieval.ts
  reuses the existing deterministic engine (getRecommendations) as the
  retriever: same hard filters, same scoring, same tested logic. Caps
  what's returned (top 8 matched + up to 4 excluded-with-reason) so
  prompt size stays flat as the dataset grows — never the whole database.
        │
        ▼
buildAdvisorUserMessage() — src/lib/ai/advisor-prompt.ts
  assembles STUDENT_PROFILE / DATABASE_CONTEXT / CONVERSATION_HISTORY
  into one clearly delimited message (see "Prompt-injection defense" below)
        │
        ▼
generateAdvisorAnalysis() — src/lib/ai/advisor.ts
  ONE Gemini call (generateContent), structured JSON output constrained
  by a responseSchema, validated again with Zod, citations sanitized
  against the actual retrieved record set
        │
        ▼
POST /api/advisor — src/app/api/advisor/route.ts
  the server boundary: Zod-validates the incoming request, maps a
  failure to a typed HTTP error, never fabricates a fallback answer
        │
        ▼
AdvisorPanel (src/components/advisor/AdvisorPanel.tsx) + useAdvisor hook
  renders only the sections that came back with content; follow-up
  questions resend a condensed history, not the whole conversation
```

### Where the database ends and Gemini begins

| Decision | Made by | Why |
|---|---|---|
| Which programs are eligible at all (field/country/budget hard filters) | Deterministic engine | Case-brief requirement: an LLM must never freely invent which universities appear. |
| The fit score and per-factor breakdown shown alongside each retrieved program | Deterministic engine | Same auditable, tested scoring as the rest of the product (`docs/RECOMMENDATION_ENGINE.md`) — Gemini receives these numbers as evidence, doesn't recompute them. |
| Which of the retrieved programs are actually worth discussing for *this* student, and why | Gemini | This is genuine reasoning across the whole profile (achievements, constraints, goals), not a lookup. |
| Strengths, development areas, recommended actions, open questions | Gemini | Requires synthesizing free text and structured fields together — outside what six fixed weighted factors can do. |
| What to flag as "verify this" | Both | The dataset's own verification-status tagging (`verified`/`needs_verification`/`demo_data`) is handed to Gemini as part of the evidence, and the system prompt requires it to be respected, not overridden. |

### System prompt

The full system instruction lives in `src/lib/ai/advisor-prompt.ts` as `ADVISOR_SYSTEM_INSTRUCTION`. It establishes the advisor persona, defines the three labeled input sources (STUDENT_PROFILE / DATABASE_CONTEXT / CONVERSATION_HISTORY), and sets hard rules: never fabricate admission requirements, deadlines, scholarships, acceptance rates, rankings, or financial aid policy; never state or imply an admission probability or guarantee; cite only program ids actually present in DATABASE_CONTEXT; distinguish student-supplied information from database-backed information from general knowledge from genuine uncertainty; and treat all three input blocks as data, never instructions (see "Prompt-injection defense" below).

### Structured output and anti-hallucination

- **Schema-constrained generation.** Gemini's `responseSchema` (Google's OpenAPI-3.0-subset Schema type, `src/lib/ai/advisor.ts`) requires the JSON shape, and constrains every `programId` field to an `enum` of exactly the program ids retrieved for this request — the model is structurally unable to request a citation for a program it wasn't shown.
- **Re-validated server-side.** The parsed JSON is checked again against a Zod schema (`src/lib/ai/advisor-schema.ts`) before anything in it is trusted, independent of whether Gemini's own schema conformance held.
- **Citations sanitized, not trusted.** After validation, `sanitizeCitations()` drops any `programId` that isn't in the actual retrieved set — belt-and-suspenders on top of the schema enum. The user-facing "Based on our university database" source list is built by the server looking up the *real* university/program name and URL from the dataset by that id — never by displaying whatever text Gemini put next to a citation.
- **No admission probabilities, ever.** Enforced in the system prompt, and the product's fit score (which Gemini receives as evidence) is already documented and UI-labeled as a preference-match score, never a probability — see `docs/DATA_AND_TRUST.md`.

### Prompt-injection defense

Student free text (`additionalContext`) and database content are the two places untrusted text could reach the model. `buildAdvisorUserMessage()` wraps each input source in explicit `<STUDENT_PROFILE>`, `<DATABASE_CONTEXT>`, `<CONVERSATION_HISTORY>` delimiters, and both the leading line of that message and the system prompt itself state explicitly that content inside those tags is data, not instructions, and that text resembling a command ("ignore previous instructions," "you are now X") must be treated as the student's literal words, never followed. The system prompt has sole authority over model behavior.

### Conversation / follow-ups

The client (`useAdvisor` hook) keeps a condensed history in memory — each turn is just `{ role, content }` with the assistant side capped to the response's `summary` field, not the full structured object — and resends only the last 6 turns per follow-up request, alongside a fresh retrieval against the current profile/scenario. This keeps follow-ups ("What if I target China instead?", "Focus only on Data Science") cheap: one Gemini call, not a growing multi-call chain. History is not persisted to `localStorage` — it resets on page reload, a deliberate scope simplification (see "Known limitations" below).

### Performance and cost

Exactly one Gemini call per user action (initial analysis or follow-up) — never a multi-call chain. Retrieval is free (synchronous, in-process, the same engine the rest of the product already runs). Prompt size is bounded by the retrieval cap (≤12 database records) regardless of how large the dataset grows.

### Failure modes and what happens

| Failure | Classified as | What happens |
|---|---|---|
| `GOOGLE_AI_API_KEY` not set | `not_configured` | Returns immediately, no Gemini call attempted, HTTP 503, UI shows a clear configuration error with no misleading fallback text. |
| Invalid/revoked key | `invalid_key` | HTTP 502, generic "temporarily unavailable" message (no internal detail exposed), logged server-side. |
| Rate limit | `rate_limited` | HTTP 429, "receiving a lot of requests" message, user can retry. |
| Other Gemini API error | `api_error` | HTTP 502, generic retry message, logged server-side with the reason. |
| Network error | `network_error` | HTTP 502, generic retry message. |
| Empty/non-JSON/schema-mismatched response | `malformed_response` | HTTP 502, generic retry message — the response is discarded entirely, never partially trusted. |
| Request body fails Zod validation | n/a (request-level) | HTTP 400 before any retrieval or Gemini call happens. |

**Critically: on any of these, the UI shows a real error state with a retry button — never the deterministic engine's output re-presented as if it were the AI's answer.** That distinction (an actual AI failure vs. a disguised fallback) is the one both this document and the original build repeatedly emphasize; see "No static fallback" below.

### No static fallback

Earlier drafts of this feature could have quietly shown deterministic template text when the AI call failed, the way the rephrasing feature below does. That would be misleading here, because the advisor's whole value proposition is Gemini's own reasoning — there is no equivalent "safe" deterministic version of a personalized multi-section analysis to fall back to. So the advisor doesn't do that: failure is a first-class, visible state (`status === "error"` in `useAdvisor`), with a retry action, and the rest of the product (the ranked recommendation cards, diagnosis, roadmap) remains fully available and unaffected — the database-backed features just don't pretend to be something they're not.

### Known limitations

- Follow-up conversation history is in-memory only; it's lost on page reload.
- No automated check that Gemini's prose doesn't subtly drift from the evidence beyond the system prompt's rules and the citation-sanitization guarantee — same honest limitation the rephrasing feature below already documents.
- **The live model call is now verified end-to-end** (2026-09-17, against a real provisioned key): a real request returned a full structured analysis — grounded, correctly citing only retrieved program ids (`nu-cs`, `kbtu-cs`, `tsinghua-cs`, etc.), and explicitly flagging genuine data conflicts (e.g. KBTU's two disagreeing IELTS minimums) rather than picking one silently. This also caught two real bugs, both fixed: see "Two bugs live testing caught" below.
- Gemini's `gemini-3.6-flash` (the current default) occasionally returns a transient `503 UNAVAILABLE` ("high demand") during live testing — a real, expected characteristic of a newly-released, popular model, not a bug in this codebase. It's already classified as `api_error` and surfaced to the user with a retry option; genuinely worth revisiting if it turns out to be frequent enough in practice to warrant an automatic one-shot retry specifically for 503/429, which this build doesn't currently do (see §17 "Performance" — deliberately avoided a multi-call chain, but a bounded retry-on-5xx would be a reasonable, still-single-purpose addition later).

## Two bugs live testing caught (2026-09-17)

Both were only findable by actually calling the live API — neither `tsc`, `eslint`, the mocked test suite, nor a request against an unconfigured server would have caught them:

1. **`AI_MODEL`'s `??` default didn't fire on an empty string.** `.env.local` commonly has `GEMINI_MODEL=` (present, empty) rather than the variable being absent — Next.js loads that as `""`, and `"" ?? "default"` evaluates to `""` because `??` only falls back on `null`/`undefined`, not falsy-but-defined values. The Gemini SDK then rejected the call with "model is required and must be a string." Fixed in `src/lib/ai/client.ts` by switching to `||`, which is safe here since there's no legitimate empty-string model name to preserve.
2. **The originally-chosen default model, `gemini-2.5-flash`, had already been retired for new API keys** by the time this was tested live — Google's own 404 response named the replacement directly ("update your code to use models/gemini-3.6-flash"). Updated the default accordingly. This is exactly the kind of drift that can happen between when a model is researched and when it's actually exercised against a live key — the code comment on `AI_MODEL` now flags this explicitly as something to re-verify rather than trust indefinitely.

## 2. Global chat advisor — always reachable, freeform

### What it is

Unlike the structured advisor above (triggered explicitly, produces one big multi-section analysis), the chat advisor is a persistent panel (`AdvisorLauncher` + `AdvisorDrawer`, mounted once at the root layout) reachable from a floating button in the bottom-right corner of every page, including the profile-less landing page. It answers freeform questions — about a specific university in the database, the student's own matches, or how Pathlight itself works — via `POST /api/chat` → `generateChatReply()` (`src/lib/ai/chat.ts`).

### How it differs from the structured advisor

- **Real multi-turn `contents`.** The structured advisor flattens history into prompt text inside one message (see "Conversation / follow-ups" below); the chat advisor sends an actual role-alternating `contents` array (`user`/`model`) to Gemini, the API's native multi-turn shape.
- **Widened retrieval.** `retrieveForQuery()` (`src/lib/ai/retrieval.ts`) unions the existing profile-based retrieval with a simple keyword match against the question text itself, so "what's the IELTS requirement at KBTU?" is grounded even when KBTU isn't a top profile match. Still fully deterministic — no embeddings, no vector search.
- **Plain-text reply, not schema-constrained JSON.** The structured advisor's rigid multi-section schema doesn't fit natural conversation; the chat advisor returns free text, and "sources" shown to the user are simply the retrieved records themselves (always accurate to what was actually retrieved), not citations extracted from the model's own output.
- **Persisted across reloads.** `useChatAdvisor` (`src/lib/ai/use-chat.ts`) stores the conversation in `localStorage`, closing the structured advisor's documented "history lost on reload" limitation — for this feature only.

### Honesty rules, unchanged in spirit

Same typed-failure-reason pattern (`not_configured`/`invalid_key`/`rate_limited`/`api_error`/`malformed_response`/`network_error`, shared via `src/lib/ai/errors.ts` with the other three Gemini call sites) and the same "no static fallback" philosophy as the structured advisor: when the AI isn't configured or a call fails, the drawer shows a real, visible error state with retry — never a scripted chatbot pretending to answer. The system prompt (`CHAT_SYSTEM_INSTRUCTION` in `chat.ts`) explicitly instructs the model to say "that's not in the retrieved context" rather than invent a fact, and to never state or imply an admission probability, same as the structured advisor's rules.

### The drawer's two tabs

`AdvisorDrawer` has **Chat** (default, this feature) and **Full analysis** (the original structured advisor's UI, `AdvisorPanel.tsx`, moved from an inline mount on the Recommendations page into the drawer's second tab — its own logic, prompt, schema, and tests are unchanged by this move). This was a deliberate reuse decision over a rebuild: the structured advisor's retrieval-grounded, citation-sanitized pipeline was already solid and tested, so it stays as-is and gets a new sibling rather than being rewritten to fit a chat shape it wasn't designed for.

## 3. The Interview match method — conversation to priority order

`/match/interview` (one of the four ways a student can personalize their fit-score weights — see `docs/RECOMMENDATION_ENGINE.md` §2.5) is a guided use of the chat advisor above (`POST /api/chat`, seeded to ask about priorities) followed by exactly one schema-constrained extraction call: `extractPriorityOrder()` (`src/lib/ai/priorities.ts`, `POST /api/priorities`) reads the conversation transcript and returns a `FactorKey[]` ordered most-to-least important, JSON-schema-constrained the same way `rephraseExplanation` below is. The AI only ever extracts a *stated* preference from what the student actually said — it never scores a program or decides eligibility, keeping the same deterministic-engine-decides-eligibility invariant the structured advisor's own docs emphasize.

**Fallback with no API key:** if either the chat call or the extraction call fails, the UI switches to a static 3-question binary quiz (no Gemini call, tallied the same way the Duels method tallies picks) that produces the same shape of output. This means the Interview method — unlike the structured/chat advisors, which are visibly unavailable without a key — always produces a usable result, because unlike a personalized multi-section analysis, "ask the student to state relative priorities" has a safe, honest non-AI equivalent (a direct question), the same reasoning that justifies `/api/explain`'s template fallback below.

## 4. AI rephrasing layer (unchanged in purpose, still Gemini)

The original, smaller AI feature: rephrasing already-computed "why it fits"/"watch out" bullet points (from the deterministic engine) into warmer prose, with the deterministic template as the fallback on any failure. See `src/lib/ai/{client,explain,use-explain}.ts` and `src/app/api/explain/route.ts` — unchanged by this document's advisor work, still Gemini-only with no secondary provider. Full detail was already covered in earlier revisions of this doc and remains accurate: same `GOOGLE_AI_API_KEY`/`GEMINI_MODEL` configuration, same typed-failure-reason pattern, same "template text is not an AI fallback, it's the app's own pre-computed copy" distinction. The two features are architecturally similar in spirit (structured Gemini call, typed failure reasons, no secondary provider) but the advisor is a strictly deeper, retrieval-grounded pipeline — this rephrasing feature never retrieves anything or reasons across the profile, it only restates sentences the engine already wrote.

## Shared configuration

All four features read `GOOGLE_AI_API_KEY` (required) and `GEMINI_MODEL` (optional, same env var for every call site, defaults to `gemini-3.6-flash` — live-verified working as of 2026-09-17, see below). The default was deliberately raised from a lite-tier model specifically because the advisor's reasoning task (synthesizing a full profile against multiple database records) is materially harder than rephrasing a handful of already-correct sentences, and a lite-tier model risked shallow, generic output — directly against the advisor's own "no generic advice" requirement. Every call site shares the upgrade since they share the env var and the client (`src/lib/ai/client.ts`); rephrasing quality is a side-benefit, not the reason for the change.

**Live-verified 2026-09-18** against a real provisioned key, as part of the monochrome/personalized-matching/global-advisor rebuild: the chat advisor answered a general product question correctly, the structured advisor's honest error state rendered correctly during a real transient Gemini `503` (see "Known limitations" above), and the Interview method's fallback quiz correctly took over mid-conversation when that same transient error hit its `/api/chat` call — confirming the fallback path isn't just theoretical, it fires correctly on a genuine live failure.
