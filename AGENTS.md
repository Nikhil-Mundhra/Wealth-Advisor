# Agent

Entry point. The root organizes a set of repos; it is not one source tree. Pick the route for the task, read that file, follow its `## Route` or `## Calls`.

## Route
- backend code → `backend/AGENTS.md`
- frontend code → `frontend/AGENTS.md`
- request and response schemas; API route docs → `contracts/AGENTS.md`
- limits, patterns, error codes, validation keys; error catalogue → `rules/AGENTS.md`
- ports, routing, containers, environment, Vercel deploy → `infra/AGENTS.md`
- database schema: multi-tenant field spec, partial; superseded where it differs → `backend/docs/database-schema.md`
- code style for any code: imports, syntax, naming, exports, constants, comments → `agents/code.md`
- docs, guides and file maps: writing or changing any .md → `agents/docs/writing.md`
- syncing file maps and docs after commits → `agents/docs/sync-docs.md`
- checking that a commit range updated the docs that own it → `agents/docs/doc-drift.md`
- syncing routes and guides after commits → `agents/docs/sync-agent.md`
- judging the project against the hackathon brief → `agents/meta/review.md`
- understanding the system across repos: architecture, roadmap; choosing what to refactor → `docs/index.md`
- how advice is produced: advisory stages, engines, tiers, agent tools; what the advisory domain still lacks → `docs/domain/index.md`

## Rules
- layout: each repo (`backend`, `frontend`, `contracts`, `rules`, `infra`) owns its `AGENTS.md`, `agents/`, `docs/` and `scripts/`; root `agents/`, `docs/` and `scripts/` hold only what spans repos; the root keeps the orchestration files (workspaces, Makefile, `vercel.json`, CI, `.env`); `infra` owns the deploy, secrets and routing rules for them.
- dependency: `rules` (imports nothing) ← `contracts` (rules, zod) ← `backend`, `frontend`; `backend` and `frontend` also import `rules` directly and never import each other.
- change: one file, one responsibility; update the owning map in the same change.
- delete/rename: grep the symbol or path, remove its references first, re-grep returns nothing.
- commit: `make test` green; never commit `.env`, `.env.local`, `.vercel/`, `dist/`; no AI attribution lines.
- commands: `make help` lists every task (dev, build, test, db, deploy).
- ci: a new check goes into `.github/workflows/ci.yml` as a `make` target; the Node major lives in `.nvmrc` and ci.yml `node-version` together.
- process control: Makefile start/stop/status act only on processes running inside this checkout; new services reuse `start_svc`, `stop_svc`, `status_svc`.
- data: `make seed-demo` is local only.
- docs: kebab-case `.md` names (`docs/implementation-plan.md`); root standards (`AGENTS.md`, `README.md`, `CLAUDE.md`) stay UPPER.
- entry: every `CLAUDE.md` is a byte copy of the `AGENTS.md` beside it; edit `AGENTS.md`, then `cp AGENTS.md CLAUDE.md` in that folder.
- icons: strict no-emoji policy across UI, copy, code, commit messages, and docs; use vector SVG icons (e.g. lucide-react) for all icons, badges, and visual indicators.

## File structure

```
.github/workflows/ci.yml : on PRs and main: docs-lint, deps-lint, typecheck, tests, frontend build
.nvmrc : Node major CI builds and local version managers use; change it and ci.yml `node-version` together
vercel.json : Vercel Services: frontend and backend service definitions, top-level rewrites, weekday market refresh cron
```
