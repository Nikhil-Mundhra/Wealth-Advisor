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
infra/docker-compose.yml : nginx edge plus optional fullstack (mongo, backend) and observability (prometheus, grafana) profiles
infra/docker/backend.Dockerfile : multi-stage non-root node:24-alpine container build with /api/health probe
infra/docker/frontend.Dockerfile : multi-stage node:24-alpine SPA build into nginx:1.29-alpine runtime
infra/k6/load-test.js : k6 staged load test script (10 to 300 VUs, <250ms P95 and <400ms P99 thresholds)
infra/nginx/default.conf : serves frontend/dist, proxies /api to the host backend, cache and security headers
infra/observability/grafana/dashboards/dewa-overview.json : Grafana dashboard for HTTP RPS/errors/latency, outbox depth, LLM cost, and guardrails
infra/observability/prometheus.yml : Prometheus scrape config polling backend /api/metrics every 15s
infra/terraform/main.tf : GCP Cloud Run v2 Always Free service (min_instance_count=0), Artifact Registry, Secret Manager bindings
infra/terraform/outputs.tf : Cloud Run URL, runtime service account email, and Artifact Registry URI outputs
infra/terraform/variables.tf : GCP project_id, region (us-central1), service_name, and image_tag variables
infra/terraform/versions.tf : Terraform >= 1.6 and Google provider ~> 6.0 constraints
```
