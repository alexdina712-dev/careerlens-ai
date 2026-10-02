# CareerLens AI

Your private CV comparison and application tracking workspace.

1. Double-click **Start CareerLens AI.cmd**. The launcher installs dependencies if needed, starts its local PostgreSQL database, builds the app, migrates, seeds fictional demo data, and starts the local API/frontend in the background.
2. Open **Open CareerLens AI.url**, or visit http://127.0.0.1:5174.
3. Click **Explore the demo workspace**. Credentials: `demo@careerlens.app` / `CareerLensDemo!2026`.
4. Create a private account to test CV uploads with fictional information. Shared demo CVs are read-only.
5. Double-click **Stop CareerLens AI.cmd** when finished. Your local database is preserved.

The installed Node/pnpm or bundled Codex runtime is used. First dependency installation needs internet. Do not run manual dev commands alongside the launcher. API port 4001 and database port 54330 are separate from OpsBoard.

## Organized project

- `app/`: actual Git repository, source, tests, migrations, installed dependencies; make code changes here.
- `Documentation/`: README, portfolio case study, API, privacy, deployment and verification.
- `Screenshots/`: actual desktop, tablet and mobile captures.
- `Backups/`: portable source ZIP, Desktop package ZIP, and Git bundle. Credentials, local databases, dependencies and runtime logs are excluded.

Private runtime files stay in `app/.env`, `app/.local-db`, and `app/.runtime`.

Live demo: https://careerlens-ai-dina19.vercel.app
GitHub: https://github.com/alexdina712-dev/careerlens-ai
Drive: https://drive.google.com/drive/folders/1BhJHWFMNLKoXRm4l_uk3Z5mq6G-nkIMF

Local mode is a transparent deterministic analyzer, not a generative AI model. Optional external AI requires a server key and explicit per-analysis consent. No hiring probability is presented.
