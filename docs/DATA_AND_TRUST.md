# Data and Trust

## The verification model

Every factual field in `src/lib/data/dataset.ts` that could go stale — tuition, deadlines, requirements, scholarships, minimum GPA — is wrapped in a `SourcedFact<T>` (`src/lib/data/types.ts`):

```ts
interface SourcedFact<T> {
  value: T;
  status: "verified" | "needs_verification" | "demo_data";
  sourceUrl?: string;
  verifiedOn?: string;
}
```

- **`verified`** — confirmed against a specific official page, with that exact URL and a verification date recorded.
- **`needs_verification`** — a plausible figure from a secondary source (a third-party aggregator, a government budget report, a catalog page that isn't the school's own finance office), likely close but not confirmed current.
- **`demo_data`** — no reliable figure was found; a value is estimated to keep the product demo-able, and honestly labeled as such rather than presented as fact.

Every place a `SourcedFact` value is shown in the UI, it's paired with a `VerificationBadge` (`src/components/ui/Badge.tsx`) — a monochrome pill distinguished by icon and border pattern (filled check / dashed outline+"?" / dotted outline), not color — so the product never lets a guess look like a confirmed number.

## Current dataset: 33 programs, 6 fields, 9 universities

The dataset started as Computer Science only (9 programs), then broadened to cover admissions generally: a second research pass added 17 more programs in Business, Engineering, Natural Sciences, and Humanities across the same 9 universities. A third pass added 7 Arts/Design programs at 7 of the 9 universities. No credible Medicine data has been found for any of these 9 institutions in any pass — that gap is reported here rather than filled with a guess.

| University | Country | Fields covered | Weakest link |
|---|---|---|---|
| MIT | USA | CS, Business, Engineering, Arts | All **verified** — same university-wide cost/admission for every major, confirmed on `sfs.mit.edu`. |
| UC Berkeley | USA | CS, Business, Engineering, Arts | Tuition is `needs_verification` (a CA budget report, not Berkeley's own page) for all four; Haas Business is actually a competitive secondary application after 2 years, not direct-admit like CS — the dataset doesn't model that pathway difference yet. |
| Arizona State University | USA | CS, Business, Engineering, Arts | Business tuition ($57,531) and Arts tuition ($32,760) are both `needs_verification` secondary-source aggregate figures, each notably different from CS/Engineering's $39,062 — plausibly real program differentials, unconfirmed. Engineering's SAT/English requirements are the most *firmly* verified entry in the whole expansion (confirmed directly on `engineering.asu.edu`). |
| Nazarbayev University | Kazakhstan | CS, Business, Engineering | Tuition and entrance requirements are **verified** for all three — NU's general admissions page confirms $15,000/yr and GPA/UNT thresholds apply university-wide, not per-program. Confirmed directly against NU's own program list that no Arts/Design degree exists here — not a gap in the research, a real absence. |
| KBTU | Kazakhstan | CS, Business | Business tuition is `demo_data` — reused the CS estimate, which is very likely wrong given it's a University-of-London dual-degree track that typically costs more. **The weakest single entry in the whole dataset.** Confirmed (via KBTU's own school list) that it has no Arts/Design program either. |
| Al-Farabi KazNU | Kazakhstan | CS, Business, Natural Sciences, Arts | All `demo_data` — no tuition figure found for this university in any field. The Design B.A. is a confirmed real 48-month program (TopUniversities.com listing), just with no sourced tuition. |
| Tsinghua University | China | CS, Business, Engineering, Arts | Business tuition is `needs_verification` with a flagged discrepancy: one source said $4,200/yr, another said $26,000/yr for the same program — needs a direct check before trusting either. Arts tuition is the one **verified** figure among the newer fields — confirmed directly on Tsinghua's own official fees page. |
| Peking University | China | CS, Business, Humanities, Arts | All `needs_verification` or `demo_data` — figures come from aggregators or a fee bracket not itemized by school, not PKU's own arts-specific fee page. |
| ShanghaiTech University | China | CS, Business, Natural Sciences, Arts | All `demo_data` (tuition) — least-documented online of the 9 for international admissions, across every field. The Industrial Design program itself (School of Creativity and Art) is confirmed real via the school's own site. |

**Only MIT and Nazarbayev University are fully verified** (tuition + requirements, every field they offer). This spread is deliberate to keep, not something to hide — it's more honest, and more interesting to show a judge, than pretending every number is equally solid. Anything with a `demo_data` or `needs_verification` badge should be treated as "needs a human to actually check the official page" before this becomes anything beyond a demo.

## Known gap: Medicine

No credible undergraduate Medicine program data has been found for any of these 9 universities in any research pass. Selecting that field in the profile form shows an explicit "this build's dataset doesn't have programs in this field yet" note rather than silently returning zero results with no explanation — see `src/app/profile/page.tsx`'s `FIELDS_WITH_PROGRAMS` check. (Arts was in this same gap until a third research pass added real programs at 7 of the 9 universities — Nazarbayev University and KBTU are confirmed, not unresearched, absences.)

## Policy for adding data in the future

1. Prefer the official university admissions/finance page as the source. Record the exact URL, not the homepage.
2. If you can't find a specific figure on an official page, either mark it `needs_verification` (secondary source) or `demo_data` (no source, estimated) — never `verified`.
3. Never let an AI-generated or freely-invented number enter this file. The dataset is the one place in the app where "no LLM invents facts" has to be absolutely true, since everything downstream (the recommendation engine, and now the AI advisor's retrieval-grounded reasoning — see `docs/AI_USAGE.md`) treats it as ground truth.
4. Re-verify anything older than a year before a real (non-demo) launch — deadlines and tuition change annually.

## Why the fit score is not an admission probability

The recommendation engine's fit score (`docs/RECOMMENDATION_ENGINE.md`) measures how well a program matches the student's *stated* preferences and known requirements — it is never framed, in code or copy, as a probability of being admitted. Real admission probability would require data this dataset doesn't have and generally isn't public (historical acceptance rates by applicant profile, holistic-review weighting, etc.) — claiming otherwise would be exactly the "fake precision" the case brief explicitly warns against. This is enforced in the diagnosis and roadmap copy and tested (`diagnosis.test.ts`: "never claims a specific admission probability").
