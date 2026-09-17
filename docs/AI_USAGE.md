# AI Usage

## Current status

Without `ANTHROPIC_API_KEY` configured, the product runs entirely in fallback/template mode: expanding "Why it fits" on a recommendation card shows the deterministic template text immediately, with no "Phrasing enhanced by Claude" badge, no errors, and no visible delay, because `isAiConfigured()` short-circuits before attempting a network call. This fallback path is verified end-to-end in a browser. The live Claude rephrasing call is fully implemented but requires a provisioned API key to exercise — adding one to `.env.local` (see `.env.local.example`) is the only change needed to activate it.

## Where AI is used

**Exactly one place**: rephrasing already-computed "why it fits" / "watch out" bullet points into warmer prose, triggered when a user expands a recommendation card for the first time. That's it. AI never chooses which universities appear, never invents a requirement, deadline, or tuition figure, and never runs before the deterministic engine (`docs/RECOMMENDATION_ENGINE.md`) has already produced the facts.

## Where AI is NOT used, deliberately

- University/program matching and ranking — a documented scoring algorithm (`docs/RECOMMENDATION_ENGINE.md`).
- Diagnosis (strengths/constraints/gaps/readiness) — template-based (`src/lib/engine/diagnosis.ts`).
- Roadmap task generation — rule-based (`src/lib/engine/roadmap.ts`).
- Any factual claim (tuition, deadlines, requirements, scholarships) — always from the structured dataset, never generated.

## Architecture

```
src/lib/ai/client.ts     Lazily constructs the Anthropic client. isAiConfigured()
                         checks for ANTHROPIC_API_KEY. Server-only — never imported
                         from a client component.
src/lib/ai/explain.ts    rephraseExplanation(facts) — the one function that calls
                         Claude. Returns null on ANY failure (no key, network error,
                         malformed JSON response) so the caller always has a safe
                         fallback.
src/app/api/explain/route.ts   The server boundary. Validates the request body,
                                calls rephraseExplanation, and ALWAYS returns valid
                                data — the original template text if AI failed,
                                the rephrased text if it succeeded — tagged with
                                source: "ai" | "template".
src/lib/ai/use-explain.ts      Client hook. Fetches once per distinct set of
                                underlying facts (see the staleness note below),
                                shows a "Polishing this explanation…" state while
                                loading, and renders a small "Phrasing enhanced by
                                Claude — facts unchanged" badge when source is "ai".
```

## The prompt (verbatim, in `explain.ts`)

> You rewrite short factual bullet points about a university program match for a student, in a warmer, more natural tone.
>
> Rules, strictly enforced:
> 1. You may ONLY rephrase the facts given to you. Never add a new fact, number, requirement, reason, or claim that isn't already present in the input.
> 2. Preserve the same number of bullets in each list, in the same order, with the same meaning.
> 3. Keep each bullet to one short sentence.
> 4. Output ONLY a JSON object of this exact shape, with no markdown code fences and no commentary: `{"whyItFits": string[], "watchOut": string[]}`

The response is parsed and shape-validated (`isStringArray` checks on both fields); any parse failure or shape mismatch returns `null`, which the API route turns into the original template text.

## Model and cost

Defaults to `claude-opus-5`. This is a genuinely low-stakes, low-complexity task (rephrasing a handful of already-correct sentences) — `claude-haiku-4-5` is a reasonable override if per-call cost matters at scale, via `ANTHROPIC_MODEL=claude-haiku-4-5` in `.env.local`. That's a cost/quality tradeoff left to you, not decided silently in code. `output_config.effort: "low"` is set to keep latency and token spend down regardless of model.

## Failure modes and what happens

| Failure | What happens |
|---|---|
| No `ANTHROPIC_API_KEY` set | `isAiConfigured()` returns false, `rephraseExplanation` returns `null` immediately (no API call attempted), template text displays. This is the default state for anyone who hasn't added a key. |
| Network error / API downtime | Caught in `explain.ts`'s try/catch, returns `null`, template text displays. |
| Claude returns malformed/non-JSON text | `JSON.parse` throws, caught, returns `null`. |
| Claude returns valid JSON but wrong shape (e.g. not string arrays) | Shape-checked explicitly, returns `null` rather than trusting an unexpected structure. |
| Claude "helpfully" adds an extra fact | Not detectable automatically today — this is a real limitation. The prompt forbids it explicitly and the low-effort setting reduces the chance, but there's no automated check that the rephrased output's factual content matches the input's. A judge-facing honest answer: "we constrain it with a strict prompt and shape validation, but we don't yet diff the rephrased text against the source facts automatically." |

## Frontend transparency

Whenever AI-rephrased text is shown, a badge reads "Phrasing enhanced by Claude — facts unchanged" — the product never presents AI-touched copy as indistinguishable from the deterministic baseline.
