# CareerLens AI

A career preparation workspace that compares CV evidence with job requirements and keeps applications organized. Built as a full-stack software engineering portfolio project.

**Analysis is advisory. It never predicts hiring probability or makes an employer decision.** The default analyzer is deterministic and works without an API key. An optional OpenAI-compatible provider can generate structured analysis only after explicit user consent.

## Explore

Choose **Explore the demo workspace** on the sign-in screen. The fictional account is `demo@careerlens.app` / `CareerLensDemo!2026`. Shared demo CVs are read-only. Create a private account to test uploads, versioning, and deletion with fictional information.

## Screenshots

Screenshots in [docs/screenshots](docs/screenshots) are captured from the functioning application. See the dashboard, CV library, tracker, analysis report, and mobile layout.

## Features

- Registration, login, persistent sessions, logout, and password-confirmed account deletion.
- Private CV libraries with PDF/DOCX/TXT extraction, reviewed text, version history, default CV selection, text download, and cascade deletion.
- Saved opportunities with company, position, location, URL, notes, searchable status/company filters, and application timelines.
- Structured comparisons: recognized skills, missing evidence, explicit experience statements, keyword tables, source excerpts, recommendations, and interview prompts.
- Immutable CV versions and job snapshots preserve what an analysis actually used; JSON exports include provenance.
- Dashboard with real counts, recent activity, and status distribution.
- Responsive UI, native modal focus handling, form validation, loading/error/empty states.

## Stack and architecture

React 19, TypeScript, Vite, React Router, custom CSS, Express 5, PostgreSQL, Prisma, Zod, bcrypt, Vitest, Supertest, and Playwright. REST APIs are separated from the UI. Shared schemas validate both sides. Prisma relations enforce ownership and deletion semantics; transactions serialize default CV/version writes.

```text
src/                  pages, reusable components, hooks, API client
server/routes/        authentication and private workspace REST routes
server/services/      provider abstraction and bounded extraction workers
shared/               validation schemas, typed analysis contract, demo content
prisma/               relational schema, committed migration, seed
scripts/              local database, supervisor, extraction worker, deployment configuration
tests/                unit, database-backed API, desktop/mobile E2E tests
docs/                 API, privacy, deployment, verification, screenshots
```

## Install and run

Requires Node.js 22+ and pnpm 11.19.0. PostgreSQL 16+ is supported. The optional local helper downloads an embedded PostgreSQL runtime; Docker is an alternative.

```sh
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
cp .env.example .env
pnpm db:generate
```

Start `pnpm dev:db` in a separate terminal (localhost PostgreSQL **54330**), then:

```sh
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://127.0.0.1:5174. API port is 4001. OpsBoard uses different local ports, so both apps can run independently. On Windows, copy `.env.example` using `Copy-Item` instead of `cp` if necessary.

For an existing PostgreSQL database, set `DATABASE_URL` in `.env` and skip `dev:db`. Migrations use `prisma migrate deploy`; no schema push is required.

## Environment

| Variable          | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`    | Server-only PostgreSQL connection; use TLS on managed hosting         |
| `PORT`            | API port, default 4001                                                |
| `APP_ORIGIN`      | Exact browser origin permitted for mutations                          |
| `NODE_ENV`        | Set `production` for secure cookies and mandatory Origin checks       |
| `SERVE_WEB`       | Optional `true` to serve built frontend from Express                  |
| `AI_BASE_URL`     | HTTPS OpenAI-compatible API base, default official API                |
| `AI_MODEL`        | Server-configured model identifier                                    |
| `AI_API_KEY`      | Optional server-only provider secret; absent means local mode         |
| `ALLOW_DEMO_SEED` | Set `true` only when deliberately seeding a production portfolio demo |

Never put credentials or private CVs in Git, screenshots, exported source archives, or frontend environment variables. Vite receives no API key. An AI-enabled deployment must communicate the actual provider and its retention policy.

## Tests

Use a disposable PostgreSQL database for API tests. All fixtures are fictional; tests clean up their own accounts.

```sh
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The database-backed tests cover authentication, session digests, origins, ownership, concurrent versions, real document extraction, default CV invariants, job/status history, analysis snapshots, and cascade deletion. Provider tests use controlled mocked HTTP responses; no paid external inference is required. Playwright checks complete desktop and mobile workflows.

For an explicitly selected hosted demo:

```sh
PUBLIC_DEMO_URL=https://your-demo.example pnpm test:e2e:public
```

GitHub Actions provisions PostgreSQL and runs migration, seed, build, unit/API tests, and Chromium desktop/mobile E2E. See [verification](docs/VERIFICATION.md) for executed results and limits.

## Deployment

See [deployment guide](docs/DEPLOYMENT.md). Supported split hosting: Vercel frontend with same-origin `/api` proxy, Render Node API, and Neon PostgreSQL. `scripts/configure-vercel.mjs` writes routing using your actual API URL. No hosting secrets are tracked. `render.yaml` describes a separate free API service; supply a fresh private database credential.

Docker support includes a multi-stage non-root image and PostgreSQL Compose service. `docker compose up --build` runs the migrations before startup. Seed deliberately using the documented command. Docker files are prepared; execution requires a working Docker installation and is reported separately from native test evidence.

## Engineering decisions

- Random session tokens are stored only as SHA-256 digests; browser cookies are HttpOnly, SameSite=Lax, and Secure in production. Passwords use bcrypt with UTF-8 byte validation.
- Private routes check both ownership and referenced entity ownership. Database cascades remove dependent sensitive records.
- Uploads stay in memory, then run in bounded workers with file signatures, ZIP expansion checks, page/text limits, a timeout, and limited concurrency. Only reviewed text is persisted.
- An `AnalysisProvider` interface separates deterministic and external providers. Structured output is validated; ungrounded external evidence is removed. Failures are shown instead of silently switching providers.
- Local comparison is transparent keyword matching, not machine learning. No scoring formula is disguised as hiring probability.
- A proven authentication/local launcher scaffold was reused from OpsBoard; CareerLens domain models, analysis services, document handling, UI and tests were implemented for this project.
- AI-assisted implementation is disclosed: this repository was built with Codex. The case study distinguishes implementation decisions from personal learning claims.

## Known limitations and future work

Local analysis recognizes a finite technology-focused dictionary and does not reliably understand negation, synonyms outside that dictionary, or verified work history. PDF extraction has no OCR; layout-heavy files need review. External provider contracts are tested with mocked responses, not paid live inference. Shared demo job changes are visible to other visitors. Public registration is for demonstration and has rate limits, but email verification, password reset, MFA, abuse monitoring, backup policy automation, and production observability remain future work.

Potential improvements: encrypted document storage, managed OCR, configurable skill taxonomies, provider evaluation datasets, email verification/reset, richer tracker notes and reminders, accessibility audits, and explicit data retention policies.

See [portfolio case study](PORTFOLIO_CASE_STUDY.md), [API reference](docs/API.md), and [privacy notes](docs/PRIVACY.md).
