# Infra

## Route
- port numbers, request routing, environment variables → `docs/infra/index.md`
- containers and runtimes → `docs/architecture/c2-containers.md`

## Rules
- ports: the Makefile variable is the source; every file `docs/infra/ports.md` lists for a port changes with it; restart what uses it (`make restart`, `make proxy`).
- routing: the implementers in `docs/infra/routing.md` change together; check with `make vercel-dev`.
- secrets: values live in the Vercel project or `.env.local`; never in `vercel.json`, compose files or the Makefile.
- deploy: `make db-indexes` against the production `MONGODB_URI` when a deploy adds or changes collections or indexes.
- process control: Makefile start/stop/status act only on processes running inside the repo; new services reuse `start_svc`, `stop_svc`, `status_svc`.

## Workflow
- add a container: service in `infra/docker-compose.yml` → Makefile targets (`.PHONY`, `## ` help, `stop`, `status`) → `docs/infra/ports.md` → `docs/architecture/c2-containers.md`

## File structure

```
infra/docker-compose.yml : nginx container in front of the host backend; host port from PROXY_PORT
infra/nginx/default.conf : serves frontend/dist, proxies /api to the host backend, cache and security headers
vercel.json : Vercel Services: frontend and backend service definitions and top-level rewrites
```
