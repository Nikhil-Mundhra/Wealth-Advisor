# Infra

## Route
- port numbers, request routing, environment variables → `infra/docs/index.md`
- containers and runtimes → `docs/architecture/c2-containers.md`

## Rules
- ports: the Makefile variable is the source; every file `infra/docs/ports.md` lists for a port changes with it; restart what uses it (`make restart`, `make proxy`).
- routing: the implementers in `infra/docs/routing.md` change together; check with `make vercel-dev`.
- secrets: values live in Vercel project settings or the root `.env`, never committed (`vercel env pull` writes `.env.local`, which nothing reads); never in `vercel.json`, compose files, the Makefile or any .md; local files point at the local Mongo, never the production database.
- deploy: the production `MONGODB_URI` and the `make jwt-keys` pair go in Vercel Production only, never Preview; `make db-indexes` against the production `MONGODB_URI` on first deploy and when a deploy adds or changes collections or indexes.

## Workflow
- add a container: service in `infra/docker-compose.yml` → Makefile targets (`.PHONY`, `## ` help, `stop`, `status`; process control in the root `AGENTS.md`) → `infra/docs/ports.md` → `docs/architecture/c2-containers.md`

## File structure

```
infra/docker-compose.yml : nginx container in front of the host backend; host port from PROXY_PORT
infra/nginx/default.conf : serves frontend/dist, proxies /api to the host backend, cache and security headers
```
