# Agent

Entry point. Pick the route for the task, read that file, follow its `## Calls`.

## Route
- frontend code → `agents/frontend/index.md`
- backend code → `agents/backend/index.md`
- ports, containers, Vercel routing and deploy → `agents/infra/index.md`
- request and response contracts → `agents/shared/contracts.md`
- writing or changing any .md → `agents/docs/writing.md`
- writing code comments → `agents/docs/comments.md`
- syncing file maps and docs after commits → `agents/docs/sync-docs.md`
- syncing routes and guides after commits → `agents/docs/sync-agent.md`
- judging the project against the hackathon brief → `agents/meta/review.md`
- understanding the system: architecture, API routes, error codes, environment, ports; choosing what to refactor → `docs/index.md`

## Rules
- One file, one responsibility; update the owning map in the same change.
- Grep a symbol or path before deleting or renaming it; remove its references first.
- `make test` green before committing; never commit `.env*`, `.vercel/`, `dist/`.
- Commit messages carry no AI attribution lines.
- `make seed-demo` is local only.

## File structure

```
.gitignore : keeps node_modules, dist, .env*, .run, .vercel out of Git
.vercelignore : keeps env files, build output and infra/ out of Vercel uploads
Agent.md : agent entry point: routes, global rules, root file map
CLAUDE.md : Claude Code entry point: imports Agent.md
Makefile : start/stop/status for frontend, backend, proxy; build, prod, vercel-dev, test, db-indexes, jwt-keys, seed-demo, docs-lint
README.md : hackathon project concept
package.json : npm workspaces root and top-level scripts
```
