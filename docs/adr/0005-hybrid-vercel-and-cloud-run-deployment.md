# ADR-0005: Hybrid Vercel Serverless and Scale-to-Zero Cloud Run Deployment Topology

- Status: Accepted
- Date: 2026-11-14

## Context

During hackathon evaluation, the web UI and Hono backend were deployed via Vercel Services (`vercel.json`) with MongoDB Atlas M0 for zero ongoing hosting cost. However, Vercel serverless functions impose cold-start and request-duration ceilings, disallow persistent background outbox drain loops, and cannot expose a continuously scraped `/api/metrics` target for Prometheus without external push gateways. We also need production-grade Infrastructure-as-Code without incurring monthly idle VM charges.

## Decision

Adopt a dual-path deployment architecture:

1. Keep the live showcase running at \$0 on **Vercel + MongoDB Atlas M0** (`vercel.json`, Hono app exported cleanly alongside `backend/src/node-server.ts`).
2. Containerize both backend and frontend with hardened multi-stage Alpine images (`infra/docker/backend.Dockerfile`, `infra/docker/frontend.Dockerfile`) running as non-root `node` with healthchecks, orchestrated locally alongside `mongo`, `prometheus`, and `grafana` via `infra/docker-compose.yml`.
3. Define declarative Infrastructure-as-Code targeting **Google Cloud Run v2** (`infra/terraform/main.tf`) configured with `min_instance_count = 0`, `max_instance_count = 3`, Secret Manager bindings (`MONGODB_URI`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`), and least-privilege IAM so container promotion to GCP stays within the Always Free tier when traffic is idle.

## Alternatives Considered

- **Dedicated always-on Compute Engine VM / Kubernetes cluster:** Full control over background workers, but introduces ongoing monthly billing, OS patching burden, and TLS ingress maintenance unnecessary for portfolio traffic.
- **Pure serverless (Vercel only) without container IaC:** Leaves out reproducible container builds, Prometheus scraping topology, and vendor-neutral deployment packaging.

## Consequences

- **Positive:** Zero fixed hosting cost today, clean local full-stack reproducibility (`make up`), and one `terraform apply` away from running the containerized Hono server on Cloud Run with Secret Manager.
- **Negative / Trade-off:** Scale-to-zero (`min_instance_count = 0`) introduces cold-start latency on first request after idle periods, and background `DurableOutboxEventBus` polling relies on in-request auto-drain on serverless until a dedicated worker instance is scaled (`min_instance_count >= 1`).
