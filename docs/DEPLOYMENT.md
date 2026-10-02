# Deployment

## Split deployment

1. Create a dedicated PostgreSQL database (for example Neon). Store its TLS connection only in backend secret settings.
2. Publish the source repository. Create a Render free Node web service using the repository's main branch, Node 22+, and `corepack enable && corepack prepare pnpm@11.19.0 --activate && pnpm install --frozen-lockfile && pnpm db:generate && pnpm build`.
3. Start with `pnpm db:migrate && pnpm start`. Set NODE_ENV=production, DATABASE_URL, APP_ORIGIN to the exact Vercel frontend origin. Health path `/api/health`.
4. In a clean source checkout, run `node scripts/configure-vercel.mjs https://YOUR-API.onrender.com`, then deploy using the Vercel CLI or import the project. The generated config proxies `/api` to the backend and routes SPA deep links to index.html. Cookies remain same-origin from the browser's perspective.
5. Seed the fresh demo database once using `ALLOW_DEMO_SEED=true pnpm db:seed:built` with its private DATABASE_URL. Seed is idempotent and fictional. Do not copy a local user's database into the public demo.
6. Test HTTPS registration, secure cookie flags, ownership, account deletion, SPA deep links, and full browser workflows. Set repository homepage to the verified live URL.

The public demo does not need an AI key and should use local analysis to avoid inference charges. If enabling external AI later, store AI_API_KEY only in the API service, configure HTTPS AI_BASE_URL and AI_MODEL, document the actual provider's privacy terms, and evaluate model output quality.

Vercel Hobby and Render/Neon free tiers are intended for this demonstration. Free Render services can sleep while idle; the first visit may take time to start. Do not purchase resources without the owner's approval. CLI frontend deployment does not imply automatic Git deployment; verify integration separately.

## Docker

Install a working Docker engine. `docker compose up --build` starts PostgreSQL and the combined app. Read compose.yaml for its documented local-only password and port mapping. Run `docker compose exec -e ALLOW_DEMO_SEED=true app node dist-server/prisma/seed.js` to add demo fixtures. Production passwords must be supplied securely. The runtime user is non-root, and extraction subprocesses are included.

## Operational follow-up

Monitor errors without CV bodies, add provider-specific backup/retention policies, verify email before broader registration, configure password reset and abuse controls, and keep dependencies patched. Native build/test evidence is distinct from Docker execution and live external model evaluation.
