# Security

## Secrets

- `ANTHROPIC_API_KEY` (and optional `ANTHROPIC_MODEL`) live only in `.env.local`, which is gitignored (`.env*` in `.gitignore`, confirmed present from the original scaffold). `.env.local.example` is committed with empty values as documentation of what's needed, never a real key.
- The Anthropic client (`src/lib/ai/client.ts`) is instantiated only in server-side code (`src/lib/ai/explain.ts`, called from the `src/app/api/explain/route.ts` route handler). It is never imported from a `"use client"` file, so the key never ships to the browser bundle.
- No other API keys or credentials exist in this codebase yet (no database, no auth provider).

## Input validation at the system boundary

The one server endpoint, `POST /api/explain`, validates its request body shape before doing anything with it (`isStringArray` checks, `typeof === "string"` checks) and returns `400` on a malformed body rather than passing untrusted input to the Anthropic SDK unchecked. There is no other network-facing input in the app — everything else (profile form, what-if controls) is client-side state that never reaches a server boundary that trusts it as anything more than UI state.

## What data leaves the browser

Only one thing, only on one action: when a user expands a recommendation card's "Why it fits" for the first time, the client sends `{ universityName, programName, whyItFits, watchOut }` to `/api/explain`, which forwards it to Claude. That payload is already-public information about a university program plus text the app itself generated — no student PII (name, contact info, exact profile) is ever included in that request or sent anywhere. Everything else (the full student profile, roadmap progress, saved programs) stays in `localStorage` on the student's own device and is never transmitted.

## XSS / injection

- No `dangerouslySetInnerHTML` anywhere in the codebase — all rendered text (including AI-rephrased copy) goes through React's default escaping.
- AI-rephrased text is still just data rendered as text content, not interpreted as markup, so even a prompt-injection attempt embedded in a university/program name (there isn't one in the current dataset, but hypothetically) couldn't execute as HTML/JS.

## Known gaps (honest, for the judge Q&A)

- **No rate limiting on `/api/explain`.** In production this endpoint could be hit repeatedly to run up Anthropic API costs. Acceptable for a hackathon demo on localStorage-only auth-less state; would need addressing (e.g. per-IP or per-session rate limiting) before any real deployment with traffic.
- **No authentication.** There are no user accounts — everything is per-browser localStorage. This was a deliberate scope decision (see `PROJECT_MASTER_GUIDE.md` §3), not an oversight, but it means there's no server-side authorization model to describe yet.
- **No CSRF protection needed currently** — the only mutating endpoint (`/api/explain`) doesn't change any server-side state (no database writes), so there's nothing for a forged request to actually damage beyond spending API credit, which the rate-limiting gap above already covers.
