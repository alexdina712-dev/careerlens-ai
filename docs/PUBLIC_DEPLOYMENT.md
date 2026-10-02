# CareerLens AI — public portfolio deployment

- Live demo: https://careerlens-ai-dina19.vercel.app
- GitHub source: https://github.com/alexdina712-dev/careerlens-ai
- Automated checks: https://github.com/alexdina712-dev/careerlens-ai/actions
- Organized Drive backup: https://drive.google.com/drive/folders/1BhJHWFMNLKoXRm4l_uk3Z5mq6G-nkIMF
- API health: https://careerlens-api-ieph.onrender.com/api/health

Frontend: Vercel Hobby. Backend: separate Render free Node service in Frankfurt. Database: dedicated Neon PostgreSQL project, CareerLens AI Portfolio Demo. DATABASE_URL exists only in private backend settings and private deployment tooling, not source or backups.

Choose **Explore the demo workspace** on the sign-in page. Fictional demo credentials: `demo@careerlens.app` / `CareerLensDemo!2026`. CV uploads and demo account deletion are disabled; private accounts can test all CV features with fictional information.

The public demo uses local deterministic analysis without an external AI key. It is not a generative model and does not predict hiring probability. The external provider adapter is implemented and contract-tested; enabling it later requires a privately configured server key, actual provider privacy information, and explicit per-analysis consent.

The public domain and API are verified, and the complete HTTPS desktop/mobile suite passed. Production session flags, Origin checks, no-store responses and real PDF/DOCX/TXT extraction were also checked.

Free hosting can pause while idle; allow time for the first API request to wake the service. Provider policies and quotas may change. See https://render.com/docs/free for current free service behavior.

## Updating the deployment

Backend deployments were triggered through the official Render API after source checks; the configured check-trigger setting is not a claim that repository webhooks are connected. Confirm each deployed commit in Render. The frontend was deployed from a clean Git archive using Vercel CLI; automatic Git deployment is not connected. Use the deployment guide and CLI to publish frontend changes.

The canonical domain is public; the automatically allocated Vercel domain redirects to it. No paid resources or external inference were purchased.
