# Deployment instructions

Facts for shipping the app. Environment values live in `infra/docs/env.md`. Routing lives in `infra/docs/routing.md`. Ports live in `infra/docs/ports.md`.

## Targets

| Target | Command | Effect |
|---|---|---|
| Vercel production | push to `main` | Vercel builds both services from `vercel.json` and serves traffic |
| Local production bundle | `make prod` | builds the frontend, serves SPA plus API from one Node process |
| Local nginx front | `make proxy` | builds the SPA, serves it through nginx in front of the backend (needs Docker, plus `make backend` for the API) |
| Local Vercel routing check | `make vercel-dev` | runs the `vercel.json` rewrites locally in the foreground (needs the Vercel CLI and a linked project) |

## Secrets

| Secret | Location | Scope |
|---|---|---|
| `MONGODB_URI` (production) | Vercel project settings | Production only |
| `AUTH_JWT_PRIVATE_KEY`, `AUTH_JWT_PUBLIC_KEY` (`make jwt-keys`) | Vercel project settings | Production only, never Preview (Preview auth fails closed without keys, so give Preview its own throwaway pair if login must work there) |
| `MARKETSTACK_ACCESS_KEY`, `CRON_SECRET` | Vercel project settings | Production (market refresh) |
| Local development values | repo-root `.env` | local runs only, and nothing reads `.env.local` |

Vercel reads no env file. Local runs read only the repo-root `.env`. Nothing reads `.env.local`.

## Database

| Event | Action |
|---|---|
| First production deploy | run `MONGODB_URI=<production-uri> make db-indexes` (shell env overrides the local `.env`) |
| A deploy adds or changes collections or indexes | run `make db-indexes` again |
| Local demo data | run `make seed-demo` (refuses `NODE_ENV=production`) |

## Cron

Vercel Cron calls `GET /api/market/refresh` weekdays at 23:00 UTC (`vercel.json`). Auth runs first: a missing or wrong `CRON_SECRET` (or missing `Authorization` header) answers `MK_1001`. With a valid secret but no `MARKETSTACK_ACCESS_KEY` it answers `MK_1903`. The env var must be named `CRON_SECRET`. Vercel injects it as the bearer header automatically.

## Check after deploy

| Check | Expected |
|---|---|
| `GET /api/health` | `ok` with database status |
| Signup, login, refresh, logout | token pair issued, session rotates |
| `/admin/login`, `/advisor/login`, `/login` | each role lands on its own console |
| Weekday 23:00 UTC cron run | prices and FX rates stored, no `MK_*` errors |
| CI `check` on the merge commit | docs-lint, deps-lint, typecheck, audit, tests, build green |
