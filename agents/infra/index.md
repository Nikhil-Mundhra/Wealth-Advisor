# Infra

## Route
- port numbers, request routing, environment variables → `docs/infra/index.md`
- containers and runtimes → `docs/architecture/c2-containers.md`

## Rules
- ports: the Makefile variable is the source; every file `docs/infra/ports.md` lists for a port changes with it; restart what uses it (`make restart`, `make proxy`).
- routing: the implementers in `docs/infra/routing.md` change together; check with `make vercel-dev`.
- secrets: values live in Vercel project settings or the repo-root `.env`, never committed (`vercel env pull` writes `.env.local`, which nothing reads); never in `vercel.json`, compose files, the Makefile or any .md; local files point at the local Mongo, never the production database.
- deploy: the production `MONGODB_URI` and the `make jwt-keys` pair go in Vercel Production only, never Preview; `make db-indexes` against the production `MONGODB_URI` on first deploy and when a deploy adds or changes collections or indexes.
- ci: a new repo-wide check goes into `.github/workflows/ci.yml` as a `make` target.
- process control: Makefile start/stop/status act only on processes running inside the repo; new services reuse `start_svc`, `stop_svc`, `status_svc`.

## Workflow
- add a container: service in `infra/docker-compose.yml` → Makefile targets (`.PHONY`, `## ` help, `stop`, `status`) → `docs/infra/ports.md` → `docs/architecture/c2-containers.md`

## File structure

```
.github/workflows/ci.yml : on PRs and main: docs-lint, deps-lint, typecheck, tests, frontend build
infra/docker-compose.yml : nginx container in front of the host backend; host port from PROXY_PORT
infra/nginx/default.conf : serves frontend/dist, proxies /api to the host backend, cache and security headers
vercel.json : Vercel Services: frontend and backend service definitions, top-level rewrites, weekday market refresh cron
```
