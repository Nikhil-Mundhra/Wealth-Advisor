# Agent

Entry point. Pick the route for the task, read that file, follow its `## Calls`.

## Route
- frontend code → `agents/frontend/index.md`
- backend code → `agents/backend/index.md`
- shared packages and dependency direction between workspaces → `agents/shared/index.md`
- ports, routing, containers, Vercel deploy → `agents/infra/index.md`
- code style for any code: imports, syntax, naming, exports, constants, comments → `agents/code.md`
- docs, guides and file maps: writing or changing any .md → `agents/docs/writing.md`
- syncing file maps and docs after commits → `agents/docs/sync-docs.md`
- syncing routes and guides after commits → `agents/docs/sync-agent.md`
- judging the project against the hackathon brief → `agents/meta/review.md`
- understanding the system: architecture, API routes, error codes, environment, ports; choosing what to refactor → `docs/index.md`

## Rules
- change: one file, one responsibility; update the owning map in the same change.
- delete/rename: grep the symbol or path, remove its references first, re-grep returns nothing.
- commit: `make test` green; never commit `.env*`, `.vercel/`, `dist/`; no AI attribution lines.
- data: `make seed-demo` is local only.

## File structure

```
.gitignore : keeps node_modules, dist, .env*, .run, .vercel out of Git
.vercelignore : keeps env files, build output and infra/ out of Vercel uploads
Agent.md : agent entry point: routes, global rules, root file map
CLAUDE.md : Claude Code entry point: imports Agent.md
IMPLEMENTATION_PLAN.md : phase-wise roadmap for FinTechathon 2026 DEWA agent
Makefile : start/stop/status for frontend, backend, proxy; build, prod, vercel-dev, test, db-indexes, jwt-keys, seed-demo, docs-lint
README.md : hackathon project concept
database_scheme.md : MongoDB Atlas multi-tenant database schema specification
package.json : npm workspaces root and top-level scripts
```
