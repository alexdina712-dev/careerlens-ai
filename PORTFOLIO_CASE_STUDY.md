# CareerLens AI — portfolio case study

## Problem

Candidates juggle CV variants, job requirements, and application statuses. Generic match scores can conceal weak evidence and imply a hiring probability that cannot be justified.

## Solution and user workflow

A user registers a private account, uploads or pastes a CV, reviews extracted text, and saves a version. They save a job description, compare it with an exact CV version, review skill evidence/gaps, and track the application from Interested through Applied, Interview, Offer, Rejected, or Archived. The dashboard summarizes real activity. Documents and associated data can be deleted.

## Key features

Private versioned CV library, bounded document extraction, immutable analysis provenance, transparent local analysis, consent-based external AI, structured recommendations, interview prompts, searchable tracker, status timelines, realistic fictional demo, and responsive dashboard.

## Architecture and database design

React components communicate through a typed REST client with Express. Zod schemas validate client and server. Prisma models users, hashed-token sessions, CVs, immutable CV versions, jobs, application events, and analysis records. User IDs scope every lookup. Foreign-key cascades delete sensitive descendants. A partial unique index and serialized transactions enforce one default CV; version creation locks the owning user to preserve unique sequences.

## AI integration

`AnalysisProvider` supports a deterministic local implementation and an HTTPS OpenAI-compatible chat completion implementation. Without a key, the full app still works. External requests require explicit consent and include only the selected documents. Responses must satisfy a strict schema; evidence excerpts must exist in the source CV. Provider/model provenance is stored. Advisory language deliberately avoids invented percentages or employer decisions.

The local analyzer is a finite dictionary and text comparison tool, not a generative model. External transport behavior is tested using controlled HTTP responses; live paid model quality has not been established by those tests.

## Technical challenges

Untrusted uploaded documents required more than file-extension checks: signatures, DOCX expansion budgets, bounded text/PDF page counts, worker memory/time controls, and concurrency limits. CV deletion had to remove analyses without deleting unrelated jobs. Version and default selection required concurrent-write protection. Public shared demos needed to prevent personal CV uploads while remaining easy to explore. Analysis snapshots needed to remain intelligible after job edits.

## Privacy considerations

Raw files are discarded after extraction. Users approve text before saving. CV access is private; no public document URLs exist. Sessions use HttpOnly cookies and database digests; passwords use bcrypt. Production mutations require the configured Origin. Account deletion requires password confirmation and revokes sessions. External inference is opt-in per analysis; provider backup/retention is separate from application deletion.

## Testing approach

Vitest unit tests exercise deterministic boundaries and provider validation. Supertest tests use actual PostgreSQL records for registration, authentication, authorization, real TXT/DOCX/PDF extraction, CV concurrency, job/status updates, snapshots, and deletion. Playwright verifies complete desktop and mobile journeys, downloads, empty states, persistence, and account deletion. CI repeats checks against a clean PostgreSQL service.

## Lessons to study and explain

This project was implemented with Codex assistance. These are engineering lessons embodied in the implementation, rather than a claim that the portfolio owner has already mastered every component: why ownership checks must include foreign references; why versioned evidence should be immutable; why model output needs runtime validation; how transactions enforce business invariants; how to test deletion and privacy; and how same-origin deployment simplifies cookies.

A candidate should review the code, run the tests, reproduce a failure, and explain the provider abstraction and database relationships before making independent proficiency claims in interviews.

## Possible future development

Email verification/reset, MFA, OCR, broader domain skill dictionaries, systematic AI evaluation, encrypted storage, richer application reminders, accessibility auditing, and operational monitoring. See the README for current limits and deployment instructions.
