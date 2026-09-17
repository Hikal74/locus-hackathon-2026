# Security

## Secrets

- `GOOGLE_AI_API_KEY` (and optional `GEMINI_MODEL`, shared by both Gemini call sites) live only in `.env.local`, which is gitignored (`.env*` in `.gitignore`, confirmed present from the original scaffold). `.env.local.example` is committed with empty/placeholder values as documentation of what's needed, never a real key.
- The Gemini client (`src/lib/ai/client.ts`) is instantiated only in server-side code — `src/lib/ai/explain.ts` (called from `POST /api/explain`) and `src/lib/ai/advisor.ts` (called from `POST /api/advisor`). Neither is ever imported from a `"use client"` file, referenced via a `NEXT_PUBLIC_*` variable, or returned in an API response body, so the key never ships to the browser bundle or a client log.
- No other API keys or credentials exist in this codebase yet (no database, no auth provider).

## Input validation at the system boundary

`POST /api/explain` validates its request body shape before doing anything with it (`isStringArray` checks, `typeof === "string"` checks) and returns `400` on a malformed body. `POST /api/advisor` validates its request body against a Zod schema (`src/lib/ai/advisor-schema.ts`) — including length caps on every free-text field (student `additionalContext` capped at 4000 characters, each follow-up question at 1000, conversation history at 8 turns of 2000 characters each) — and returns `400` with the specific validation issues on a malformed body, before any retrieval or Gemini call happens. There is no other network-facing input in the app — everything else (profile form, what-if controls) is client-side state that never reaches a server boundary that trusts it as anything more than UI state.

## What data leaves the browser

Two things, both server-boundary AI calls, neither including raw student PII beyond what the student explicitly typed into the free-text field:

- Expanding a recommendation card's "Why it fits" sends `{ universityName, programName, whyItFits, watchOut }` to `/api/explain`, which forwards it to Gemini. That payload is already-public information about a university program plus text the app itself generated.
- Requesting or following up on an AI advisor analysis sends the full `StudentProfile` (including the optional free-text `additionalContext` field) to `/api/advisor`, which forwards a database-context-augmented version of it to Gemini. This is the one place in the app where a student's free-text input reaches an external API — the profile form's free-text step says so explicitly ("goes straight to the AI advisor"), and the system prompt treats that text as untrusted data, never as instructions (see docs/AI_USAGE.md's "Prompt-injection defense").

Everything else (the full student profile at rest, roadmap progress, saved programs) stays in `localStorage` on the student's own device and is never transmitted except via the two calls above.

## Prompt injection

The AI advisor is the one feature that sends a meaningful amount of student-authored free text into a model prompt (see above). `src/lib/ai/advisor-prompt.ts` wraps that text (and the retrieved database content) in explicit delimiters and both the system instruction and the user message state that content inside those delimiters is data, never instructions — see `docs/AI_USAGE.md` for the full defense. This is a mitigation, not a formal guarantee; a sufficiently adversarial free-text submission attempting to override the advisor's behavior is a known category of risk for any LLM feature that accepts free text, and this is called out here rather than left implicit.

## XSS / injection

- No `dangerouslySetInnerHTML` anywhere in the codebase — all rendered text (including AI-rephrased copy) goes through React's default escaping.
- AI-rephrased text is still just data rendered as text content, not interpreted as markup, so even a prompt-injection attempt embedded in a university/program name (there isn't one in the current dataset, but hypothetically) couldn't execute as HTML/JS.

## Known gaps (honest, for the judge Q&A)

- **No rate limiting on `/api/explain` or `/api/advisor`.** In production either endpoint could be hit repeatedly to run up Gemini API costs — `/api/advisor` more so, since it's a larger, more expensive call. Acceptable for a hackathon demo on localStorage-only auth-less state; would need addressing (e.g. per-IP or per-session rate limiting) before any real deployment with traffic.
- **No authentication.** There are no user accounts — everything is per-browser localStorage. This was a deliberate scope decision (see `PROJECT_MASTER_GUIDE.md` §3), not an oversight, but it means there's no server-side authorization model to describe yet.
- **No CSRF protection needed currently** — neither mutating endpoint (`/api/explain`, `/api/advisor`) changes any server-side state (no database writes), so there's nothing for a forged request to actually damage beyond spending API credit, which the rate-limiting gap above already covers.
